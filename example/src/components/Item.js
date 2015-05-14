import React from 'react';
import {ql} from '../../../lib/ql';
import flux from '../flux';
import connectToStores from '../utils/connectToStores';

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
    flux.getActions('item').setPrice(this.props.item, this.props.item.get('price') + 1);
  }

  deleteItem() {
    flux.getActions('item').deleteItem(this.props.item);
  }

  render() {
    const {item} = this.props;
    const created = !!item.get('id');

    return (
      <span>
        <b>{item.get('title')}</b>
        &nbsp;
        <i>{item.get('price')}</i>
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
