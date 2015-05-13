import React from 'react';
import Category from './Category';
import {ql} from '../../lib/ql';

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
        <Category category={this.props.category} createItem={this.props.flux.getActions('item').createItem} />
      </div>
    );
  }
}
