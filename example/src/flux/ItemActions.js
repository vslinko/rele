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
    const categoryId = item.getIn(['links', 'category', 'linkage', 'id']);

    const optimisticRequest = this.flux.startOptimisticRequest({
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

      optimisticRequest.commit({
        merge: collectJsonApiItems(json)
      });
    } catch (e) {
      optimisticRequest.cancel();
      // TODO: Show error
      console.log(e.stack);
    }
  }

  @syncronize({
    limit: 1,
    queueKey: itemId => `ItemActions#${itemId}`
  })
  async setPrice(itemId, price, lock) {
    const item = this.flux.getResource('Item', itemId);

    const optimisticRequest = this.flux.startOptimisticRequest({
      merge: item.set('price', price)
    });

    try {
      const {canceled} = await lock;

      if (canceled) {
        return optimisticRequest.cancel();
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

      optimisticRequest.commit({
        merge: collectJsonApiItems(json)
      });
    } catch (error) {
      optimisticRequest.cancel();
      this.handleSetPriceError(item, price, error);
    }
  }

  async deleteItem(itemId) {
    const item = this.flux.getResource('Item', itemId);

    const categoryId = item.getIn(['links', 'category', 'linkage', 'id']);

    const optimisticRequest = this.flux.startOptimisticRequest({
      remove: item
    });

    try {
      const response = await fetch(`/api/items/${item.get('id')}?include=category`, {
        method: 'DELETE'
      });

      const json = await response.json();
      await timeout(1000);

      optimisticRequest.commit({
        merge: collectJsonApiItems(json),
        remove: item
      });
    } catch (e) {
      optimisticRequest.cancel();
      // TODO: Show error
    }
  }

  handleSetPriceError(item, price, error) {
    return {item, price, error};
  }
}
