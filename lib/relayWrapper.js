import React from 'react';
import normalizeTree from './normalizeTree';
import createQuery from './createQuery';
import print from './ql/print';

export default function relayWrapper(relay) {
  const actions = relay.getActions('relay');
  const store = relay.getStore('relay');

  return function(Component) {
    return class RelayComponent extends React.Component {
      constructor(props) {
        super(props);

        this.state = this.getState();
        this.listener = () => {
          this.setState(this.getState());
        };

        Object.keys(Component.queries).forEach(key => {
          const query = Component.queries[key]();
          console.log(JSON.stringify(query, null, 2));
          console.log(print(query));
        });
      }

      componentWillMount() {
        store.on('change', this.listener);

        this.getQueries().forEach(query => {
          actions.request(query);
        });
      }

      componentWillUnmount() {
        store.removeListener('change', this.listener);
      }

      getTrees() {
        const queries = Component.query();

        return Object.keys(queries).reduce((trees, key) => {
          trees[key] = normalizeTree(queries[key]);
          return trees;
        }, {});
      }

      getQueries() {
        const trees = this.getTrees();

        return Object.keys(trees).map(key => {
          return createQuery(trees[key], relay.urlMatcher);
        });
      }

      getState() {
        const trees = this.getTrees();

        return Object.keys(trees).reduce((state, key) => {
          state[key] = store.fulfill(trees[key]);
          return state;
        }, {});
      }

      render() {
        return <Component {...this.props} {...this.state} />;
      }
    };
  };
}
