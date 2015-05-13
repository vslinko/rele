import 'whatwg-fetch';
import React from 'react';
import relayWrapper from '../../lib/react/relayWrapper';
import App from './App';
import flux from './f';

const RelayApp = relayWrapper(flux)(App);

document.addEventListener('DOMContentLoaded', () => {
  React.render(<RelayApp flux={flux} />, document.getElementById('app'));
});
