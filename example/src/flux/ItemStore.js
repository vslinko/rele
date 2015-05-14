import {Store} from 'flummox';

export default class ItemStore extends Store {
  constructor(flux) {
    super();

    this.register(flux.getActions('item').handleSetPriceError, this.handleSetPriceError);

    this.errors = {};
  }

  handleSetPriceError({item, price, error}) {
    this.errors[item.get('id')] = error;
    this.forceUpdate();
  }

  getError(item) {
    return this.errors[item.get('id')];
  }
}
