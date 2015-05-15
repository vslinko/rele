import {Flummox} from 'flummox';
import ReleActions from './ReleActions';
import ReleStore from './ReleStore';
import uniqueRequestId from './util/uniqueRequestId';

function wrapper(obj) {
  if (Array.isArray(obj)) {
    return obj.slice();
  } else {
    return Object.assign({links: {}}, obj);
  }
}

function merger(a, b) {
  return Object.assign({}, a, b, {links: Object.assign({}, a.links, b.links)});
}

function getter(obj, key) {
  return obj[key];
}

function linkGetter(obj, linkName) {
  return obj.links[linkName].linkage;
}

export default class Rele extends Flummox {
  constructor(options = {}) {
    super();

    this.wrapper = options.wrapper || wrapper;
    this.merger = options.merger || merger;
    this.getter = options.getter || getter;
    this.linkGetter = options.linkGetter || linkGetter;

    this.requestId = 0;

    this.createActions('rele', ReleActions, this);
    this.createStore('rele', ReleStore, this);
  }

  createReleActions(key, cls, ...args) {
    this.createActions(`${key}Rele`, cls, ...args);
  }

  getResource(type, id) {
    return this.getStore('rele').getResource(type, id);
  }

  getRequestsCount() {
    return this.getStore('rele').getRequestsCount();
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
