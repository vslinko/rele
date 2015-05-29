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
      addToLinkage: [
        ['Category', item.getIn(['links', 'category', 'linkage', 'id']), 'items']
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

  async setPrice(id, price) {
    try {
      return await this.updateItem(id, {type: 'Item', id, price});
    } catch (error) {
      this.handleSetPriceError(id, price, error);
    }
  }

  deleteItem(id) {
    return this.flux.optimisticDelete({
      url: `/api/items/${id}?include=category`,
      item: {type: 'Item', id}
    });
  }

  handleSetPriceError(itemId, price, error) {
    return {itemId, price, error};
  }
}
