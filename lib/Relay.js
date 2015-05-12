import {Flummox} from 'flummox';
import RelayActions from './RelayActions';
import RelayStore from './RelayStore';

export default class Relay extends Flummox {
  constructor({urlMatcher}) {
    super();

    this.urlMatcher = urlMatcher;

    this.createActions('relay', RelayActions);
    this.createStore('relay', RelayStore, this);
  }
}
