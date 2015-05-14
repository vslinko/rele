# Rele

> Rele is mix of Relay concept and Flummox library.

## Example

```
npm install
cd example
node server.js &
../node_modules/.bin/webpack-dev-server &
open http://localhost:8080
```

## QL Example

```js
import {ql} from '../ql';
import print from '../ql/print';

const userSpec = ql`
  User {
    name,
    avatar
  }
`;

const groupSpec = ql`
  Group {
    name,
    users {
      ${userSpec}
    }
  }
`;

const groupsPageQuery = ql`
  groups(page: ${1}) {
    ${groupSpec},
    users : User {
      isAdmin
    }
  }
`;

console.log(print(groupsPageQuery));
/* Normalized query:
groups(page: 1) : Group {
  name,
  users : User {
    isAdmin,
    name,
    avatar
  }
}
*/
```
