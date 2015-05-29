import React from 'react';
import copyStatics from 'copy-statics';

export default function relePreload(rele) {
  const actions = rele.getActions('rele');

  return copyStatics(Component => {
    return class RelePreloadComponent extends React.Component {
      componentWillMount() {
        const queries = Object.keys(Component.queries).reduce((acc, key) => {
          acc[key] = Component.queries[key]();
          return acc;
        }, {});

        Object.keys(queries).forEach(key => {
          actions.request(queries[key]);
        });
      }

      render() {
        return <Component {...this.props} />;
      }
    };
  });
}
