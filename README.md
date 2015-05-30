# Rele

> Rele is mix of Relay concept and Flummox library.

## Example

```
npm install
npm start &
open http://localhost:3000
```

## QL Example

```js
import {ql} from 'rele';
import {print} from 'rele/utils';

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
      ${userSpec()}
    }
  }
`;

const groupsPageQuery = ql`
  groups(page: ${1}) {
    ${groupSpec()},
    users : User {
      isAdmin
    }
  }
`;

console.log(print(groupsPageQuery()));
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
