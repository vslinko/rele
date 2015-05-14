import {Flummox} from 'flummox';
import ReleActions from './ReleActions';
import ReleStore from './ReleStore';

export default class Rele extends Flummox {
  constructor() {
    super();

    this.createActions('rele', ReleActions, this);
    this.createStore('rele', ReleStore, this);
  }

  createReleActions(key, cls, ...args) {
    this.createActions(`${key}Rele`, cls, ...args);
  }
}
