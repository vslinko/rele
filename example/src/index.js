import 'whatwg-fetch';
import React from 'react';
import Relay from '../../lib/Relay';
import relayWrapper from '../../lib/relayWrapper';
import App from './App';

function urlMatcher(type, params) {
  if (type === 'category' && params.id) {
    return `/api/categories/${params.id}`;
  }
}

const relay = new Relay({urlMatcher});
const RelayApp = relayWrapper(relay)(App);

document.addEventListener('DOMContentLoaded', () => {
  React.render(<RelayApp />, document.getElementById('app'));
});
