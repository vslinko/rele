import {Actions} from 'flummox';
import timeout from '../utils/timeout';
import optimistic from '../utils/optimistic';

export default class ItemActions extends Actions {
  constructor(flux) {
    super();
    this.flux = flux;
  }

  @optimistic({
    optimisticChanges: (item) => ({
      addToLinkage: [['Category', item.getIn(['links', 'category', 'linkage', 'id']), 'items', item]],
      add: [item]
    })
  })
  async createItem(item) {
    // TODO: Handle error
    const response = await fetch('/api/items?include=category', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: item.toJS()
      })
    });

    await timeout(1000);
    return await response.json();
  }

  @optimistic({
    optimisticChanges: (itemId, price, flux) => ({
      merge: [flux.getResource('Item', itemId).set('price', price)]
    }),
    syncronize: {
      queueKey: itemId => `ItemActions#${itemId}`,
      limit: 1
    }
  })
  async setPrice(itemId, price) {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {type: 'Item', id: itemId, price}
        })
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error('Server error');
      }

      await timeout(1000);
      const json = await response.json();

      if (json.errors) {
        throw new Error(json.errors[0].title);
      }

      return json;
    } catch (error) {
      this.handleSetPriceError(itemId, price, error);
      throw error;
    }
  }

  @optimistic({
    optimisticChanges: (itemId, flux) => ({
      remove: [flux.getResource('Item', itemId)]
    })
  })
  async deleteItem(itemId) {
    // TODO: Handle error
    const response = await fetch(`/api/items/${itemId}?include=category`, {
      method: 'DELETE'
    });

    await timeout(1000);
    return await response.json();
  }

  handleSetPriceError(itemId, price, error) {
    return {itemId, price, error};
  }
}
