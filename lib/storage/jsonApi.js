import collectJsonApiResources from '../util/collectJsonApiResources';

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

function typeGetter(obj) {
  return obj.type;
}

function idGetter(obj) {
  return obj.id;
}

function relationshipGetter(obj, name) {
  return obj.relationships[name].data;
}

export default {
  wrapper,
  merger,
  getter,
  typeGetter,
  idGetter,
  relationshipGetter,
  getResourcesFromResponse: collectJsonApiResources
};
