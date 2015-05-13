import {Flummox} from 'flummox';
import RelayActions from './RelayActions';
import RelayStore from './RelayStore';

export default class Relay extends Flummox {
  constructor() {
    super();

    this.createActions('relay', RelayActions, this);
    this.createStore('relay', RelayStore, this);
  }

  createRelayActions(key, cls, ...args) {
    this.createActions(`${key}Relay`, cls, ...args);
  }
}
