import {Store} from 'flummox';

export default class ItemStore extends Store {
  constructor(flux) {
    super();

    this.register(flux.getActions('item').handleSetPriceError, this.handleSetPriceError);
    this.register(flux.getActions('item').setDisabled, this.handleSetDisabled);

    this.errors = {};
    this.disabled = {};
  }

  handleSetDisabled({id, disabled}) {
    this.disabled[id] = disabled;
    this.forceUpdate();
  }

  handleSetPriceError({itemId, price, error}) {
    this.errors[itemId] = error;
    this.forceUpdate();
  }

  getError(itemId) {
    return this.errors[itemId];
  }

  isDisabled(id) {
    return this.disabled[id] || false;
  }
}
