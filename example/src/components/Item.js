import React from 'react';
import {ql} from '../../../lib/ql';
import flux from '../flux';
import connectToStores from '../utils/connectToStores';

@connectToStores(flux, {
  item: (store, {item}) => ({
    error: store.getError(item.id)
  })
})
export default class Item extends React.Component {
  static queries = {
    item: ql`
      Item {
        id,
        title,
        price
      }
    `
  };

  incrementPrice() {
    flux.getActions('item').setPrice(this.props.item.id, this.props.item.price + 1);
  }

  deleteItem() {
    flux.getActions('item').deleteItem(this.props.item.id);
  }

  render() {
    const {item} = this.props;
    const created = !!item.id;

    return (
      <span>
        <b>{item.title}</b>
        &nbsp;
        <i>{item.price}</i>
        &nbsp;
        {created &&
          <button onClick={() => this.incrementPrice()}>Increment</button>
        }
        &nbsp;
        {created &&
          <button onClick={() => this.deleteItem()}>Delete</button>
        }
        {this.props.error && `Unable to increment: ${this.props.error.message}`}
      </span>
    );
  }
}
