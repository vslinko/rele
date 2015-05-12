import React from 'react';

export default class Item extends React.Component {
  static query() {
    return {
      item: {
        type: 'item',
        fields: ['title']
      }
    };
  }

  render() {
    return (
      <div>
        <h3>{this.props.item.title}</h3>
      </div>
    );
  }
}
