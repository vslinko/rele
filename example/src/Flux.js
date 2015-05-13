import Relay from '../../lib/Relay';
import ItemActions from './ItemActions';
import ItemStore from './ItemStore';
import fetchJsonApi from './fetchJsonApi';

export default class Flux extends Relay {
  constructor() {
    super({
      methods: {
        category: {
          fetcher({id}, fields, include, parent) {
            return fetchJsonApi(`/api/categories/${id}`, fields, include);
          },
          filter({id}, parent, store) {
            return store.get('Category').get(id);
          }
        },
        items: {
          fetcher({}, fields, include, parent) {
            const params = [];
            if (parent.type === 'Category') {
              params.push(`filter[category]=${parent.id}`);
            }
            return fetchJsonApi(`/api/items`, fields, include, params);
          },
          filter({}, parent, store) {
            let items = store.get('Item');
            if (parent.type === 'Category') {
              items = items.filter(item => item.links.category.linkage.id === parent.id);
            }
            return items;
          }
        }
      }
    });

    this.createActions('item', ItemActions, this);
    this.createStore('item', ItemStore, this);
  }
}
