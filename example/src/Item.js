import React from 'react';
import {ql} from '../../lib/ql';

export default class Item extends React.Component {
  static queries = {
    item() {
      return ql`
        Item {
          title
        }
      `;
    }
  };

  render() {
    return (
      <div>
        <h3>{this.props.item.title}</h3>
      </div>
    );
  }
}
