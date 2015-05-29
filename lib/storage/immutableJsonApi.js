import Immutable from 'immutable';
import collectJsonApiResources from '../util/collectJsonApiResources';

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

function typeGetter(obj) {
  return obj.get('type');
}

function idGetter(obj) {
  return obj.get('id');
}

function relationshipGetter(obj, name) {
  const relationship = obj.getIn(['relationships', name, 'data']);
  return relationship && relationship.toJS();
}

function getResourcesFromResponse(response) {
  return collectJsonApiResources(response).map(wrapper);
}

export default {
  wrapper,
  merger,
  getter,
  typeGetter,
  idGetter,
  relationshipGetter,
  getResourcesFromResponse
};
