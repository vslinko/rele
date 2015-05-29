import {Flummox} from 'flummox';
import ReleActions from './ReleActions';
import ReleStore from './ReleStore';
import uniqueRequestId from './util/uniqueRequestId';

function wrapper(obj) {
  return obj;
}

function merger(a, b) {
  const attributes = Object.assign({}, a.attributes, b.attributes);
  const relationships = Object.assign({}, a.relationships, b.relationships);

  return {
    type: a.type || b.type,
    id: a.id || b.id,
    attributes,
    relationships
  };
}

function getter(obj, key) {
  if (key === 'type' || key === 'id') {
    return obj[key];
  } else {
    return obj.attributes[key];
  }
}

function linkGetter(obj, linkName) {
  return obj.relationships[linkName].data;
}

export default class Rele extends Flummox {
  constructor(options = {}) {
    super();

    const releActions = options.releActions || {};
    Object.keys(releActions).forEach(key => {
      this.createReleActions(key, releActions[key], this);
    });

    this.wrapper = options.wrapper || wrapper;
    this.merger = options.merger || merger;
    this.getter = options.getter || getter;
    this.linkGetter = options.linkGetter || linkGetter;

    this.createActions('rele', ReleActions, this);
    this.createStore('rele', ReleStore, this);
  }

  createReleActions(key, cls, ...args) {
    this.createActions(`${key}Rele`, cls, ...args);
  }

  mergeJsonApiResponse(json) {
    this.getActions('rele').response(json);
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
