import {Actions} from 'flummox';
import fetchJsonApi from './fetchJsonApi';

export default class CategoryRelayActions extends Actions {
  fetch({id}, fields, include, parent) {
    return fetchJsonApi(`/api/categories/${id}`, fields, include);
  }

  static filter({id}, parent, store) {
    return store.get('Category').get(id);
  }
}
