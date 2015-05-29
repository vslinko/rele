import React from 'react';
import {ql} from '../../../lib/ql';
import flux from '../flux';
import connectToStores from '../utils/connectToStores';

@connectToStores(flux, {
  item: (store, {item}) => ({
    error: store.getError(item.id),
    disabled: store.isDisabled(item.id)
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

  incrementPriceO() {
    flux.getActions('item').setPriceO(this.props.item.id, this.props.item.price + 1);
  }

  incrementPriceP() {
    flux.getActions('item').setPriceP(this.props.item.id, this.props.item.price + 1);
  }

  deleteItem() {
    flux.getActions('item').deleteItem(this.props.item.id);
  }

  render() {
    const {item, disabled} = this.props;
    const created = !!item.id;

    return (
      <span>
        <b>{item.title}</b>
        &nbsp;
        <i>{item.price}</i>
        &nbsp;
        {created &&
          <button onClick={() => this.incrementPriceO()} disabled={disabled}>Optimistic Increment</button>
        }
        &nbsp;
        {created &&
          <button onClick={() => this.incrementPriceP()} disabled={disabled}>Pessimistic Increment</button>
        }
        &nbsp;
        {created &&
          <button onClick={() => this.deleteItem()} disabled={disabled}>Delete</button>
        }
        {this.props.error && `Unable to increment: ${this.props.error.message}`}
      </span>
    );
  }
}
