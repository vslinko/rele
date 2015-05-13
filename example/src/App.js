import React from 'react';
import Category from './Category';
import {ql} from '../../lib/ql';

export default class App extends React.Component {
  static queries = {
    category() {
      return ql`
        category(id: ${1}) {
          ${Category.queries.category()}
        }
      `;
    }
  };

  static query() {
    return {
      category: {
        type: 'category',
        params: {id: 1},
        merge: [Category.query().category]
      }
    };
  }

  render() {
    if (!this.props.category) {
      return null;
    }

    return (
      <div>
        <Category category={this.props.category} />
      </div>
    );
  }
}
