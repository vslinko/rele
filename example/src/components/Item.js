import React from 'react';
import {ql} from '../../../lib/ql';
import flux from '../flux';
import observer from '../utils/observer';

@observer
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

  observe() {
    const {item} = this.props;

    return {
      error: flux.observeStore('item', store => store.getError(item.id)),
      disabled: flux.observeStore('item', store => store.isDisabled(item.id))
    };
  }

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
    const {item} = this.props;
    const {error, disabled} = this.data;
    const created = !!item.id;

    return (
      <span>
        <b>{item.title}</b>
        &nbsp;
        <i>{item.price}</i>
        &nbsp;
        {created &&
          <button onClick={::this.incrementPriceO} disabled={disabled}>Optimistic Increment</button>
        }
        &nbsp;
        {created &&
          <button onClick={::this.incrementPriceP} disabled={disabled}>Pessimistic Increment</button>
        }
        &nbsp;
        {created &&
          <button onClick={::this.deleteItem} disabled={disabled}>Delete</button>
        }
        {error && `Unable to increment: ${error.message}`}
      </span>
    );
  }
}
