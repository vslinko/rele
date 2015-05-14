import {Actions} from 'flummox';
import fetchJsonApi from '../utils/fetchJsonApi';

export default class CategoryReleActions extends Actions {
  fetch({id}, fields, include, parent, flux) {
    return fetchJsonApi(`/api/categories/${id}`, fields, include);
  }

  static filter({id}, parent, store, flux) {
    return store.getResource('Category', id);
  }
}
