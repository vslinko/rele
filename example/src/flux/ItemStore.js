import {Store} from 'flummox';

export default class ItemStore extends Store {
  constructor(flux) {
    super();

    this.register(flux.getActions('item').handleSetPriceError, this.handleSetPriceError);

    this.errors = {};
  }

  handleSetPriceError({itemId, price, error}) {
    this.errors[itemId] = error;
    this.forceUpdate();
  }

  getError(itemId) {
    return this.errors[itemId];
  }
}
