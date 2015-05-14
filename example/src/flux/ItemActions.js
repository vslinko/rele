import uniqueRequestId from '../../../lib/util/uniqueRequestId';
import timeout from '../utils/timeout';
import {Actions} from 'flummox';
import syncronize from '../utils/syncronize';
import collectJsonApiItems from '../utils/collectJsonApiItems';

export default class ItemActions extends Actions {
  constructor(flux) {
    super();
    this.flux = flux;
  }

  async createItem(item) {
    const requestId = uniqueRequestId();

    const categoryId = item.getIn(['links', 'category', 'linkage', 'id']);

    this.flux.getActions('rele').startOptimisticRequest(requestId, {
      addToLinkage: [['Category', categoryId, 'items', item]],
      add: item
    });

    try {
      const response = await fetch('/api/items?include=category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: item.toJS()
        })
      });

      const json = await response.json();
      await timeout(1000);

      this.flux.getActions('rele').endOptimisticRequest(requestId, {
        merge: collectJsonApiItems(json)
      });
    } catch (e) {
      this.flux.getActions('rele').cancelOptimisticRequest(requestId);
      // TODO: Show error
      console.log(e.stack);
    }
  }

  @syncronize(1, itemId => `ItemActions#${itemId}`)
  async setPrice(itemId, price, lock) {
    const requestId = uniqueRequestId();

    const item = this.flux.getStore('rele').get('Item').get(itemId);
    this.flux.getActions('rele').startOptimisticRequest(requestId, {
      merge: item.set('price', price)
    });

    try {
      const {canceled} = await lock;

      if (canceled) {
        return this.flux.getActions('rele').cancelOptimisticRequest(requestId);
      }

      const response = await fetch(`/api/items/${item.get('id')}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {type: item.get('type'), id: item.get('id'), price}
        })
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error('Server error');
      }

      const json = await response.json();
      await timeout(1000);

      if (json.errors) {
        throw new Error(json.errors[0].title);
      }

      this.flux.getActions('rele').endOptimisticRequest(requestId, {
        merge: collectJsonApiItems(json)
      });
    } catch (error) {
      this.flux.getActions('rele').cancelOptimisticRequest(requestId);
      this.handleSetPriceError(item, price, error);
    }
  }

  async deleteItem(itemId) {
    const requestId = uniqueRequestId();

    const item = this.flux.getStore('rele').get('Item').get(itemId);
    const categoryId = item.getIn(['links', 'category', 'linkage', 'id']);

    this.flux.getActions('rele').startOptimisticRequest(requestId, {
      remove: item
    });

    try {
      const response = await fetch(`/api/items/${item.get('id')}?include=category`, {
        method: 'DELETE'
      });

      const json = await response.json();
      await timeout(1000);

      this.flux.getActions('rele').endOptimisticRequest(requestId, {
        merge: collectJsonApiItems(json),
        remove: item
      });
    } catch (e) {
      this.flux.getActions('rele').cancelOptimisticRequest(requestId);
      // TODO: Show error
    }
  }

  handleSetPriceError(item, price, error) {
    return {item, price, error};
  }
}
