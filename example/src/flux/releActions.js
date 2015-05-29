import {releAction} from '../../..';
import fetchJsonApi from '../utils/fetchJsonApi';

export const category = releAction({
  fetch({id}, fields, include, parent, flux) {
    return fetchJsonApi(`/api/categories/${id}`, fields, include);
  },

  filter({id}, parent, store, flux) {
    return store.getResource('Category', id);
  }
});

export const items = releAction({
  fetch({}, fields, include, parent, flux) {
    const params = [];

    if (parent && parent.type === 'Category') {
      params.push(`filter[category]=${parent.id}`);
    }

    return fetchJsonApi(`/api/items`, fields, include, params);
  },

  filter({}, parent, store, flux) {
    let items = store.get('Item');

    if (parent && parent.type === 'Category') {
      items = items.filter(item => item.links.category.linkage.id === parent.id);
    }

    return items;
  }
});
