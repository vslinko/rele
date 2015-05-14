import {Actions} from 'flummox';
import fetchJsonApi from '../utils/fetchJsonApi';

export default class ItemsReleActions extends Actions {
  fetch({}, fields, include, parent) {
    const params = [];

    if (parent.type === 'Category') {
      params.push(`filter[category]=${parent.id}`);
    }

    return fetchJsonApi(`/api/items`, fields, include, params);
  }

  static filter({}, parent, store) {
    let items = store.get('Item');

    if (parent.type === 'Category') {
      items = items.filter(item => item.links.category.linkage.id === parent.id);
    }

    return items;
  }
}
