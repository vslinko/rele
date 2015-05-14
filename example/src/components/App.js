import React from 'react';
import Category from './Category';
import {ql} from '../../..';
import releWrapper from '../../../releWrapper';
import flux from '../flux';
import connectToStores from '../utils/connectToStores';

@releWrapper(flux)
@connectToStores(flux, {
  rele: (store) => ({
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
