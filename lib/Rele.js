import {Flummox} from 'flummox';
import ReleActions from './ReleActions';
import ReleStore from './ReleStore';

function wrapper(obj) {
  if (Array.isArray(obj)) {
    return obj.slice();
  } else {
    return Object.assign({links: {}}, obj);
  }
}

function merger(a, b) {
  return Object.assign({}, a, b);
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

    this.createActions('rele', ReleActions, this);
    this.createStore('rele', ReleStore, this);
  }

  createReleActions(key, cls, ...args) {
    this.createActions(`${key}Rele`, cls, ...args);
  }
}
