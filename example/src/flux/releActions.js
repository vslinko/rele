import {releAction} from '../../..';
import fetchJsonApi from '../utils/fetchJsonApi';

function singleResourceAction({url, type}) {
  return releAction({
    fetch({id}, fields, include, parent, flux) {
      return fetchJsonApi(url.replace(':id', id), fields, include);
    },

    filter({id}, parent, store, flux) {
      return store.getResource(type, id);
    }
  })
}

function collectionAction({url, type, parent = {}}) {
  return releAction({
    fetch({}, fields, include, parentResource, flux) {
      let params = [];

      if (parentResource && parent[parentResource.type]) {
        const paramsFn = parent[parentResource.type].params;
        params = params.concat(paramsFn(parentResource));
      }

      return fetchJsonApi(url, fields, include, params);
    },

    filter({}, parentResource, store, flux) {
      let resources = store.get(type);

      if (parentResource && parent[parentResource.type]) {
        const filter = parent[parentResource.type].filter;
        resources = resources.filter(resource => filter(resource, parentResource));
      }

      return resources;
    }
  });
}

export const category = singleResourceAction({
  url: '/api/categories/:id',
  type: 'Category'
});

export const items = collectionAction({
  url: '/api/items',
  type: 'Item',
  parent: {
    Category: {
      params: category => `filter[category]=${category.id}`,
      filter: (item, category) => item.relationships.category.data.id === category.id
    }
  }
});
