# relay-flummox-jsonapi

```
npm install
cd example
node server.js &
../node_modules/.bin/webpack-dev-server &
open http://localhost:8080
```

## QL Example

```js
const argumentValue = "123";
const query = ql`
someAction(argumentName: ${argumentValue}) {
  someField,
  someImport {
    Class {
      field
    }
  },
  someImport:Class {
    field
  },
  someNestedAction():Class {
    field
  }
}
`;
```
