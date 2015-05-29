import {Rele} from '../../..';
import AppActions from './AppActions';
import ItemActions from './ItemActions';
import ItemStore from './ItemStore';
import {collectJsonApiResources} from '../../..';
import timeout from '../utils/timeout';
import {synchronizeFunction} from 'synchronize-calls';
import * as releActions from './releActions';

export default class Flux extends Rele {
  constructor() {
    super({releActions});

    this.createActions('app', AppActions, this);
    this.createActions('item', ItemActions, this);
    this.createStore('item', ItemStore, this);
  }

  optimisticCreate({url, item, addToRelationships, syncronize}) {
    return this.optimistic({
      url,
      method: 'POST',
      data: item,
      optimisticChanges: {
        addToRelationships: addToRelationships.map(addition => addition.concat([item])),
        add: [item]
      },
      syncronize
    });
  }

  optimisticUpdate({url, item, syncronize}) {
    return this.optimistic({
      url,
      method: 'PUT',
      data: item,
      optimisticChanges: {
        merge: [item]
      },
      syncronize
    });
  }

  optimisticDelete({url, item, syncronize}) {
    return this.optimistic({
      url,
      method: 'DELETE',
      optimisticChanges: {
        remove: [item]
      },
      syncronize
    });
  }

  optimistic({url, method, data, optimisticChanges, syncronize}) {
    let fn = async (lock) => {
      const optimisticRequest = this.startOptimisticRequest(optimisticChanges);

      try {
        if (syncronize) {
          const {canceled} = await lock;

          if (canceled) {
            optimisticRequest.cancel();
            return;
          }
        }

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: data && JSON.stringify({data})
        });

        if (response.status < 200 || response.status >= 300) {
          throw new Error(response.statusText);
        }

        const json = await response.json();
        await timeout(1000);

        if (json && json.errors) {
          throw new Error(json.errors[0].title);
        }

        optimisticRequest.commit({
          merge: collectJsonApiResources(json),
          remove: optimisticChanges.remove
        });
      } catch (e) {
        optimisticRequest.cancel();
        throw e;
      }
    };

    if (syncronize) {
      fn = synchronizeFunction(fn, syncronize);
    }

    return fn();
  }
}
