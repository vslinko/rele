import React from 'react';
import {hocDecorator, getWrappedComponent} from 'hoc';

export default hocDecorator(
  Component => class ReleDumbComponent extends React.Component {
    static getQuery(key) {
      return getWrappedComponent(Component).queries[key]();
    }

    static getQueries() {
      const queries = getWrappedComponent(Component).queries;

      return Object.keys(queries).reduce((acc, key) => {
        acc[key] = queries[key]();
        return acc;
      }, {});
    }

    render() {
      return <Component {...this.props} />;
    }
  }
);
