import {Flummox} from 'flummox';
import RelayActions from './RelayActions';
import RelayStore from './RelayStore';

export default class Relay extends Flummox {
  constructor({methods = {}}) {
    super();

    this.methods = methods;

    this.createActions('relay', RelayActions, this);
    this.createStore('relay', RelayStore, this);
  }
}
