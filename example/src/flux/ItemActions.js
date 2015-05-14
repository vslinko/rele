import uniqueRequestId from '../../../lib/util/uniqueRequestId';
import timeout from '../utils/timeout';
import {Actions} from 'flummox';
import {SyncError, syncronize} from '../utils/syncronize';

export default class ItemActions extends Actions {
  constructor(flux) {
    super();
    this.flux = flux;
  }

  async createItem(item) {
    const id = uniqueRequestId();

    this.flux.getActions('rele').startCreateRequest(id, item);

    try {
      const response = await fetch('/api/items', {
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

      this.flux.getActions('rele').endCreateRequest(id, json);
    } catch (e) {
      this.flux.getActions('rele').endCreateRequest(id, null);
      throw e;
    }
  }

  @syncronize(item => `ItemActions${item.get('id')}`)
  async setPrice(item, price, lock) {
    const id = uniqueRequestId();

    this.flux.getActions('rele').startUpdateRequest(id, item.set('price', price));

    try {
      await lock;

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

      this.flux.getActions('rele').endUpdateRequest(id, json);
    } catch (error) {
      this.flux.getActions('rele').endUpdateRequest(id, null);

      if (!(error instanceof SyncError)) {
        this.handleSetPriceError(item, price, error);
      }

      // stop queue
      throw error;
    }
  }

  async deleteItem(item, lock) {
    const id = uniqueRequestId();

    this.flux.getActions('rele').startDeleteRequest(id, item);

    try {
      await lock;

      const response = await fetch(`/api/items/${item.get('id')}`, {
        method: 'DELETE'
      });

      const json = await response.json();
      await timeout(1000);

      this.flux.getActions('rele').endDeleteRequest(id, true, json);
    } catch (e) {
      this.flux.getActions('rele').endDeleteRequest(id, false);
      throw e;
    }
  }

  handleSetPriceError(item, price, error) {
    return {item, price, error};
  }
}
