import React from 'react';
import Item from './Item';
import {ql} from '../../../lib/ql';
import flux from '../flux';

export default class Category extends React.Component {
  static queries = {
    category() {
      return ql`
        Category {
          id,
          title,
          subtitle,
          items() {
            id,
            ${Item.queries.item()}
          },
          avatar : Avatar {
            url
          }
        }
      `;
    }
  };

  createItem() {
    flux.getActions('item').createItem({
      type: 'Item',
      id: null,
      price: 0,
      title: String(Math.random()),
      links: {
        category: {
          linkage: {
            type: 'Category',
            id: this.props.category.id
          }
        }
      }
    });
  }

  renderItem(item, index) {
    return (
      <div key={item.id || `unsaved${index}`}>
        {item.id || 'Saving'}
        &nbsp;
        <Item item={item} />
      </div>
    );
  }

  render() {
    return (
      <div>
        <img src={this.props.category.avatar.url} />
        <h1>{this.props.category.title}</h1>
        <h2>{this.props.category.subtitle}</h2>
        {this.props.category.items.map((item, index) => this.renderItem(item, index))}
        <button onClick={() => this.createItem()}>Create New</button>
      </div>
    );
  }
}
