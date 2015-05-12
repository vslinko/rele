import {Actions} from 'flummox';
import createUrl from './createUrl';

export default class RelayActions extends Actions {
  async request(query) {
    const {baseUrl, fields, include} = query;

    const url = createUrl(baseUrl, fields, include);
    const response = await fetch(url);
    const json = await response.json();

    return {query, url, json};
  }
}
