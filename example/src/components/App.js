import React from 'react';
import Category from './Category';
import {ql} from '../../..';
import relePreload from '../../../relePreload';
import flux from '../flux';
import connectToStores from '../utils/connectToStores';

@connectToStores(flux, {
  rele: (store) => ({
    killRandomResource: () => {
      const types = Object.keys(store.resources);
      const type = types[Math.round(Math.random() * (types.length - 1))];
      const ids = Object.keys(store.resources[type]);
      const id = ids.length > 0 ? ids[Math.round(Math.random() * (ids.length - 1))] : null;
      if (id) {
        console.log(`Removed ${type} ${id}`);
        delete store.resources[type][id];
        store.forceUpdate();
      }
    },
    requestsCount: store.getOptimisticRequestsCount(),
    category: store.fulfill(App.queries.category())
  })
})
@relePreload(flux)
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
        <p><button onClick={() => this.props.killRandomResource()}>Garbage Collector (kills random resource from store)</button></p>
        <Category category={this.props.category} />
        {this.props.requestsCount > 0 && `Saving ${this.props.requestsCount}`}
      </div>
    );
  }
}
