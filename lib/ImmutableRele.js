import Rele from './Rele';
import Immutable from 'immutable';

function wrapper(obj) {
  if (Immutable.Map.isMap(obj) || Immutable.List.isList(obj)) {
    return obj;
  } else {
    return Immutable.fromJS(obj);
  }
}

function merger(a, b) {
  return a.merge(b);
}

function getter(obj, key) {
  return obj.get(key);
}

function linkGetter(obj, linkName) {
  return obj.getIn(['links', linkName, 'linkage']).toJS();
}

export default class ImmutableRele extends Rele {
  constructor(options = {}) {
    options.wrapper = options.wrapper || wrapper;
    options.merger = options.merger || merger;
    options.getter = options.getter || getter;
    options.linkGetter = options.linkGetter || linkGetter;

    super(options);
  }
}
