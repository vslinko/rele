export default function newItem(data = {}) {
  const links = Object.assign(
    {category: {linkage: null}},
    data.links || {}
  );

  const item = Object.assign(
    {
      type: 'Item',
      id: null,
      price: 0,
      title: ''
    },
    data,
    {links}
  );

  return item;
}
