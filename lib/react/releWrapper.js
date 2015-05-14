import React from 'react';

export default function releWrapper(rele) {
  const actions = rele.getActions('rele');
  const store = rele.getStore('rele');

  return function(Component) {
    return class ReleComponent extends React.Component {
      constructor(props) {
        super(props);

        this.state = this.getState();
        this.listener = () => {
          this.setState(this.getState());
        };
      }

      getQueries() {
        return Object.keys(Component.queries).reduce((acc, key) => {
          acc[key] = Component.queries[key]();
          return acc;
        }, {});
      }

      getState() {
        const queries = this.getQueries();

        return Object.keys(queries).reduce((state, key) => {
          state[key] = store.fulfill(queries[key]);
          return state;
        }, {});
      }

      componentWillMount() {
        const queries = this.getQueries();

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
  };
}
