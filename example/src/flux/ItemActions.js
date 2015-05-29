import {Actions} from 'flummox';
import timeout from '../utils/timeout';

export default class ItemActions extends Actions {
  constructor(flux) {
    super();
    this.flux = flux;
  }

  createItem(item) {
    return this.flux.optimisticCreate({
      url: '/api/items?include=category',
      item,
      addToRelationships: [
        ['Category', item.relationships.category.data.id, 'items']
      ]
    });
  }

  updateItem(id, item) {
    return this.flux.optimisticUpdate({
      url: `/api/items/${id}`,
      item,
      syncronize: {
        queueKey: `Item#${id}`,
        limit: 1
      }
    });
  }

  async setPriceO(id, price) {
    try {
      return await this.updateItem(id, {type: 'Item', id, attributes: {price}});
    } catch (error) {
      this.handleSetPriceError(id, price, error);
    }
  }

  async setPriceP(id, price) {
    this.setDisabled(id, true);

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            type: 'Item',
            id,
            attributes: {price}
          }
        })
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.statusText);
      }

      const json = await response.json();
      await timeout(1000);

      this.flux.mergeJsonApiResponse(json);

    } catch (error) {
      this.handleSetPriceError(id, price, error);
    }

    this.setDisabled(id, false);
  }

  deleteItem(id) {
    return this.flux.optimisticDelete({
      url: `/api/items/${id}?include=category`,
      item: {type: 'Item', id}
    });
  }

  setDisabled(id, disabled) {
    return {id, disabled};
  }

  handleSetPriceError(itemId, price, error) {
    return {itemId, price, error};
  }
}
