import React from 'react';
import Item from './Item';
import {ql} from '../../lib/ql';

export default class Category extends React.Component {
  static queries = {
    category() {
      return ql`
        Category {
          title,
          subtitle,
          items {
            ${Item.queries.item()}
          }
        }
      `;
    }
  };

  render() {
    return (
      <div>
        <h1>{this.props.category.title}</h1>
        <h2>{this.props.category.subtitle}</h2>
        {this.props.category.items.map(item => <Item item={item} />)}
      </div>
    );
  }
}
