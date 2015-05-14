import Immutable from 'immutable';

export default function newItem(data = {}) {
  return Immutable.fromJS({
    type: 'Item',
    id: null,
    price: 0,
    title: '',
    links: {
      category: {
        linkage: null
      }
    }
  }).merge(data);
}
