import React from 'react';
import Category from './Category';
import {ql} from '../../..';
import relePreload from '../../../relePreload';
import flux from '../flux';
import observer from '../utils/observer';

@observer
export default class App extends React.Component {
  static queries = {
    category: ql`
      category(id: ${"2"}) {
        ${Category.queries.category()}
      }
    `
  };

  componentWillMount() {
    flux.getActions('rele').request(App.queries.category());
  }

  observe() {
    return {
      requestsCount: flux.observeStore('rele', store => store.getOptimisticRequestsCount()),
      category: flux.observeStore('rele', store => store.fulfill(App.queries.category()))
    };
  }

  render() {
    if (!this.data.category) {
      return null;
    }

    return (
      <div>
        <Category category={this.data.category} />
        {this.data.requestsCount > 0 && `Saving ${this.data.requestsCount}`}
      </div>
    );
  }
}
