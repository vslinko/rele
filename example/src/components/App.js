import React from 'react';
import Category from './Category';
import {ql} from '../../../lib/ql';
import relayWrapper from '../../../lib/react/relayWrapper';
import flux from '../flux';
import connectToStores from '../utils/connectToStores';

@relayWrapper(flux)
@connectToStores(flux, {
  relay: (store) => ({
    requestsCount: store.getRequestsCount()
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
        {this.props.requestsCount > 0 && `Saving ${this.props.requestsCount}`}
        <Category category={this.props.category} />
      </div>
    );
  }
}
