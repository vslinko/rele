import uniqueRequestId from '../../lib/util/uniqueRequestId';
import timeout from './timeout';
import {Actions} from 'flummox';

export default class ItemActions extends Actions {
  constructor(flux) {
    super();
    this.flux = flux;
  }

  async createItem(item) {
    const id = uniqueRequestId();

    this.flux.getActions('relay').startRequest(id, item);

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

    this.flux.getActions('relay').endRequest(id, json);
  }
}
