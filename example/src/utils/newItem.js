export default function newItem(data = {}) {
  const attributes = Object.assign(
    {
      price: 0,
      title: ''
    },
    data.attributes || {}
  );

  const relationships = Object.assign(
    {
      category: {data: null}
    },
    data.relationships || {}
  );

  return {
    type: 'Item',
    id: data.id || null,
    attributes,
    relationships
  };
}
