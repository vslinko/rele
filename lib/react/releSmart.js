import React from 'react';
import copyStatics from 'copy-statics';

export default function releSmart(rele) {
  const actions = rele.getActions('rele');
  const store = rele.getStore('rele');

  return copyStatics(Component => {
    return class ReleSmartComponent extends React.Component {
      static getQueries() {
        const queries = Component.queries;

        return Object.keys(queries).reduce((acc, key) => {
          acc[key] = queries[key]();
          return acc;
        }, {});
      }

      constructor(props) {
        super(props);

        this.state = this.getState();

        this.listener = () => {
          this.setState(this.getState());
        };
      }

      getState() {
        const queries = ReleSmartComponent.getQueries();

        return Object.keys(queries).reduce((state, key) => {
          state[key] = store.fulfill(queries[key]);
          return state;
        }, {});
      }

      componentWillMount() {
        const queries = ReleSmartComponent.getQueries();

        Object.keys(queries).forEach(key => {
          actions.request(queries[key]);
        });

        store.on('change', this.listener);
      }

      componentWillUnmount() {
        store.removeListener('change', this.listener);
      }

      render() {
        return <Component {...this.props} {...this.state} />;
      }
    };
  });
}
