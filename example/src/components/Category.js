import React from 'react';
import Item from './Item';
import {ql} from '../../../lib/ql';
import flux from '../flux';
import newItem from '../utils/newItem';

export default class Category extends React.Component {
  static queries = {
    category() {
      return ql`
        Category {
          id,
          title,
          subtitle,
          items {
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
    flux.getActions('item').createItem(newItem({
      title: String(Math.random()),
      links: {
        category: {
          linkage: {
            type: 'Category',
            id: this.props.category.get('id')
          }
        }
      }
    }));
  }

  renderItem(item, index) {
    return (
      <div key={item.get('id') || `unsaved${index}`}>
        {item.get('id') || 'Saving'}
        &nbsp;
        <Item item={item} />
      </div>
    );
  }

  render() {
    const {category} = this.props;
    const avatar = category.get('avatar');

    return (
      <div>
        <img src={avatar.get('url')} />
        <h1>{category.get('title')}</h1>
        <h2>{category.get('subtitle')}</h2>
        {category.get('items').map((item, index) => this.renderItem(item, index))}
        <button onClick={() => this.createItem()}>Create New</button>
      </div>
    );
  }
}
