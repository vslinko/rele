import 'whatwg-fetch';
import React from 'react';
import App from './components/App';

document.addEventListener('DOMContentLoaded', () => {
  React.render(<App />, document.getElementById('app'));
});
