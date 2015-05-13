import Relay from '../../lib/Relay';
import ItemActions from './ItemActions';
import ItemStore from './ItemStore';
import CategoryRelayActions from './CategoryRelayActions';
import ItemsRelayActions from './ItemsRelayActions';

export default class Flux extends Relay {
  constructor() {
    super();

    this.createRelayActions('category', CategoryRelayActions);
    this.createRelayActions('items', ItemsRelayActions);
    this.createActions('item', ItemActions, this);
    this.createStore('item', ItemStore, this);
  }
}
