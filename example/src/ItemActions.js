import uniqueRequestId from '../../lib/util/uniqueRequestId';
import timeout from './timeout';
import {Actions} from 'flummox';
import {SyncError, syncronize} from './syncronize';

export default class ItemActions extends Actions {
  constructor(flux) {
    super();
    this.flux = flux;
  }

  async createItem(item) {
    const id = uniqueRequestId();

    this.flux.getActions('relay').startCreateRequest(id, item);

    const response = await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: item
      })
    });

    const json = await response.json();
    await timeout(1000);

    this.flux.getActions('relay').endCreateRequest(id, json);
  }

  @syncronize
  async setPrice(item, price, lock) {
    const id = uniqueRequestId();

    this.flux.getActions('relay').startUpdateRequest(id, Object.assign({}, item, {price}));

    try {
      await lock;

      const response = await fetch(`/api/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {type: item.type, id: item.id, price}
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

      this.flux.getActions('relay').endUpdateRequest(id, json);
    } catch (error) {
      this.flux.getActions('relay').endUpdateRequest(id, null);

      if (!(error instanceof SyncError)) {
        this.handleSetPriceError(item, price, error);
      }

      // stop queue
      throw error;
    }
  }

  handleSetPriceError(item, price, error) {
    return {item, price, error};
  }
}
