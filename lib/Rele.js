import {Flummox} from 'flummox';
import ReleActions from './ReleActions';
import ReleStore from './ReleStore';
import uniqueRequestId from './util/uniqueRequestId';
import jsonApiStorage from './storage/jsonApi';

export default class Rele extends Flummox {
  constructor(options = {}) {
    super();

    const releActions = options.releActions || {};
    Object.keys(releActions).forEach(key => {
      this.createReleActions(key, releActions[key], this);
    });

    const storage = options.storage || jsonApiStorage;
    this.wrapper = storage.wrapper;
    this.merger = storage.merger;
    this.getter = storage.getter;
    this.typeGetter = storage.typeGetter;
    this.idGetter = storage.idGetter;
    this.relationshipGetter = storage.relationshipGetter;
    this.getResourcesFromResponse = storage.getResourcesFromResponse;

    this.watchers = {};

    this.createActions('rele', ReleActions, this);
    this.createStore('rele', ReleStore, this);
  }

  observeStore(key, getter) {
    const store = this.getStore(key);

    return {
      subscribe: (callback) => {
        const watcher = () => {
          callback(getter(store));
        };

        this.watchers[key].push(watcher);
        watcher();

        return {
          dispose: () => {
            this.watchers[key] = this.watchers[key].filter(w => w !== watcher);
          }
        };
      }
    };
  }

  releRequest(query) {
    this.getActions('rele').request(query);
  }

  fulfillReleQuery(query) {
    return this.observeStore('rele', store => store.fulfill(query));
  }

  createReleActions(key, cls, ...args) {
    this.createActions(`${key}Rele`, cls, ...args);
  }

  mergeResponse(response) {
    this.getActions('rele').mergeResponse(response);
  }

  createStore(key, cls, ...args) {
    super.createStore(key, cls, ...args);

    this.watchers[key] = [];

    this.getStore(key).on('change', () => {
      this.watchers[key].forEach(watcher => watcher());
    });
  }

  getResource(type, id) {
    return this.getStore('rele').getResource(type, id);
  }

  getOptimisticRequestsCount() {
    return this.getStore('rele').getOptimisticRequestsCount();
  }

  startOptimisticRequest(changes) {
    const requestId = uniqueRequestId();

    this.getActions('rele').startOptimisticRequest(requestId, changes);

    return {
      requestId,
      commit: changes => {
        this.getActions('rele').endOptimisticRequest(requestId, changes);
      },
      cancel: () => {
        this.getActions('rele').cancelOptimisticRequest(requestId);
      }
    };
  }
}
