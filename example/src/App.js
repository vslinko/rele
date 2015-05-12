import React from 'react';
import Category from './Category';

export default class App extends React.Component {
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
