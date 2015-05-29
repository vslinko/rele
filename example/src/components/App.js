import React from 'react';
import Category from './Category';
import {ql} from '../../..';
import releSmart from '../../../releSmart';
import flux from '../flux';
import connectToStores from '../utils/connectToStores';

@releSmart(flux)
@connectToStores(flux, {
  rele: (store) => ({
    requestsCount: store.getRequestsCount()
  })
})
export default class App extends React.Component {
  static queries = {
    category: ql`
      category(id: ${"2"}) {
        ${Category.queries.category()}
      }
    `
  };

  render() {
    if (!this.props.category) {
      return null;
    }

    return (
      <div>
        <Category category={this.props.category} />
        {this.props.requestsCount > 0 && `Saving ${this.props.requestsCount}`}
      </div>
    );
  }
}
