import ImmutableRele from '../../../ImmutableRele';
import AppActions from './AppActions';
import ItemActions from './ItemActions';
import ItemStore from './ItemStore';
import CategoryReleActions from './CategoryReleActions';
import ItemsReleActions from './ItemsReleActions';
import collectJsonApiItems from '../utils/collectJsonApiItems';
import timeout from '../utils/timeout';
import {syncronizeFn} from '../utils/syncronize';

export default class Flux extends ImmutableRele {
  constructor() {
    super();

    this.createReleActions('category', CategoryReleActions);
    this.createReleActions('items', ItemsReleActions);
    this.createActions('app', AppActions, this);
    this.createActions('item', ItemActions, this);
    this.createStore('item', ItemStore, this);
  }

  optimisticCreate({url, item, addToLinkage, syncronize}) {
    return this.optimistic({
      url,
      method: 'POST',
      data: item.toJS(), // TODO
      optimisticChanges: {
        addToLinkage: addToLinkage.map(linkage => linkage.concat([item])),
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
        merge: [this.wrapper(item)]
      },
      syncronize
    });
  }

  optimisticDelete({url, item, syncronize}) {
    return this.optimistic({
      url,
      method: 'DELETE',
      optimisticChanges: {
        remove: [this.wrapper(item)]
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
          merge: collectJsonApiItems(json),
          remove: optimisticChanges.remove
        });
      } catch (e) {
        optimisticRequest.cancel();
        throw e;
      }
    };

    if (syncronize) {
      fn = syncronizeFn(fn, syncronize);
    }

    return fn();
  }
}
