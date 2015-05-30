import React from 'react';
import Category from './Category';
import {ql} from '../../..';
import flux from '../flux';
import observe from 'react-observe-decorator';

@observe
export default class App extends React.Component {
  static queries = {
    category: ql`
      category(id: ${"2"}) {
        ${Category.queries.category()}
      }
    `
  };

  componentWillMount() {
    flux.releRequest(App.queries.category());
  }

  observe() {
    return {
      requestsCount: flux.observeStore('rele', store => store.getOptimisticRequestsCount()),
      category: flux.fulfillReleQuery(App.queries.category())
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
