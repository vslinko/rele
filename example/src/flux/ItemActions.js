import uniqueRequestId from '../../../lib/util/uniqueRequestId';
import timeout from '../utils/timeout';
import {Actions} from 'flummox';
import syncronize from '../utils/syncronize';

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
      this.flux.getActions('rele').cancelCreateRequest(id);
      // TODO: Show error
    }
  }

  @syncronize(1, item => `ItemActions#${item.get('id')}`)
  async setPrice(item, price, lock) {
    const id = uniqueRequestId();

    this.flux.getActions('rele').startUpdateRequest(id, item.set('price', price));

    try {
      const {canceled} = await lock;

      if (canceled) {
        return this.flux.getActions('rele').cancelUpdateRequest(id);
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

      this.flux.getActions('rele').endUpdateRequest(id, json);
    } catch (error) {
      this.flux.getActions('rele').cancelUpdateRequest(id);
      this.handleSetPriceError(item, price, error);
    }
  }

  async deleteItem(item) {
    const id = uniqueRequestId();

    this.flux.getActions('rele').startDeleteRequest(id, item);

    try {
      const response = await fetch(`/api/items/${item.get('id')}`, {
        method: 'DELETE'
      });

      const json = await response.json();
      await timeout(1000);

      this.flux.getActions('rele').endDeleteRequest(id, json);
    } catch (e) {
      this.flux.getActions('rele').cancelDeleteRequest(id);
      // TODO: Show error
    }
  }

  handleSetPriceError(item, price, error) {
    return {item, price, error};
  }
}
