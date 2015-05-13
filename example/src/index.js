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
    }
  }
});

const RelayApp = relayWrapper(relay)(App);

document.addEventListener('DOMContentLoaded', () => {
  React.render(<RelayApp />, document.getElementById('app'));
});
