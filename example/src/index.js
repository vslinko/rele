import 'whatwg-fetch';
import React from 'react';
import Relay from '../../lib/Relay';
import relayWrapper from '../../lib/react/relayWrapper';
import App from './App';
import fetchJsonApi from './fetchJsonApi';

const relay = new Relay({
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

const RelayApp = relayWrapper(relay)(App);

document.addEventListener('DOMContentLoaded', () => {
  React.render(<RelayApp />, document.getElementById('app'));
});
