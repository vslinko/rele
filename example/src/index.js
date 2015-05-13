import 'whatwg-fetch';
import React from 'react';
import App from './components/App';

import {ql} from '../../lib/ql'

ql`
User {
}
`;

document.addEventListener('DOMContentLoaded', () => {
  React.render(<App />, document.getElementById('app'));
});
