import Rele from './Rele';
import Immutable from 'immutable';

function wrapper(obj) {
  return Immutable.fromJS(obj);
}

function merger(a, b) {
  const attributes = a.get('attributes').merge(b.get('attributes'));
  const relationships = a.get('relationships').merge(b.get('relationships'));

  return Immutable.Map({
    type: a.get('type') || b.get('type'),
    id: a.get('id') || b.get('id'),
    attributes,
    relationships
  });
}

function getter(obj, key) {
  if (key === 'type' || key === 'id') {
    return obj.get(key);
  } else {
    return obj.getIn(['attributes', key]);
  }
}

function linkGetter(obj, linkName) {
  const linkage = obj.getIn(['relationships', linkName, 'data']);
  return linkage && linkage.toJS();
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
