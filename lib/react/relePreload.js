import React from 'react';
import copyStatics from 'copy-statics';

export default function relePreload(rele) {
  const actions = rele.getActions('rele');
  const store = rele.getStore('rele');

  return copyStatics(Component => {
    return class RelePreloadComponent extends React.Component {
      preload(force = false) {
        Object.keys(Component.queries).forEach(key => {
          const query = Component.queries[key]();

          if (force || !store.fulfill(query)) {
            actions.request(query);
          }
        });
      }

      componentWillMount() {
        this.preload(true);
      }

      componentWillUpdate() {
        this.preload();
      }

      render() {
        return <Component {...this.props} />;
      }
    };
  });
}
