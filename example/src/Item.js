import React from 'react';
import {ql} from '../../lib/ql';
import flux from './f';
import connectToStores from './connectToStores';

@connectToStores(flux, {
  item: (store, {item}) => ({
    error: store.getError(item)
  })
})
export default class Item extends React.Component {
  static queries = {
    item() {
      return ql`
        Item {
          title,
          price
        }
      `;
    }
  };

  incrementPrice() {
    flux.getActions('item').setPrice(this.props.item, this.props.item.price + 1);
  }

  deleteItem() {
    flux.getActions('item').deleteItem(this.props.item);
  }

  render() {
    return (
      <span>
        <b>{this.props.item.title}</b>
        &nbsp;
        <i>{this.props.item.price}</i>
        &nbsp;
        {this.props.item.id &&
          <button onClick={() => this.incrementPrice()}>Increment</button>
        }
        &nbsp;
        {this.props.item.id &&
          <button onClick={() => this.deleteItem()}>Delete</button>
        }
        {this.props.error && `Unable to increment: ${this.props.error.message}`}
      </span>
    );
  }
}
