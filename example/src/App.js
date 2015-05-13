import React from 'react';
import Category from './Category';
import {ql} from '../../lib/ql';
import flux from './f';
import connectToStores from './connectToStores';

@connectToStores(flux, {
  relay: (store) => ({
    hasUncompletedRequests: store.hasUncompletedRequests()
  })
})
export default class App extends React.Component {
  static queries = {
    category() {
      return ql`
        category(id: ${"1"}) {
          ${Category.queries.category()}
        }
      `;
    }
  };

  render() {
    if (!this.props.category) {
      return null;
    }

    return (
      <div>
        {this.props.hasUncompletedRequests && 'Saving...'}
        <Category category={this.props.category} />
      </div>
    );
  }
}
