import 'whatwg-fetch';
import React from 'react';
import Relay from '../../lib/Relay';
import relayWrapper from '../../lib/react/relayWrapper';
import App from './App';

const relay = new Relay({
  methods: {
    category({id}, fields, include) {
      return {
        baseUrl: `/api/categories/${id}`,
        id
      };
    },
    items({}, fields, include, parent) {
      return {
        baseUrl: `/api/items?category=${parent.id}`
      };
    }
  }
});

const RelayApp = relayWrapper(relay)(App);

document.addEventListener('DOMContentLoaded', () => {
  React.render(<RelayApp />, document.getElementById('app'));
});
