var Hapi = require('hapi');

var server = new Hapi.Server();

var id = 1;
function getUniqueId() {
  return String(id++);
}

const avatarId = getUniqueId();
const categoryId = getUniqueId();
const itemIds = [getUniqueId(), getUniqueId(), getUniqueId()];

const data = {
  Avatar: [
    {
      type: 'Avatar',
      id: avatarId,
      attributes: {
        url: 'http://lorempixel.com/100/100/'
      }
    }
  ],
  Category: [
    {
      type: 'Category',
      id: categoryId,
      attributes: {
        title: 'Phones',
        subtitle: 'Mobile phones'
      },
      relationships: {
        avatar: {
          data: {type: 'Avatar', id: avatarId}
        },
        items: {
          data: [
            {type: 'Item', id: itemIds[0]},
            {type: 'Item', id: itemIds[1]},
            {type: 'Item', id: itemIds[2]}
          ]
        }
      }
    }
  ],
  Item: [
    {
      type: 'Item',
      id: itemIds[0],
      attributes: {
        title: 'iPhone 6 Plus',
        price: 100
      },
      relationships: {
        category: {
          data: {
            type: 'Category',
            id: categoryId
          }
        }
      }
    },
    {
      type: 'Item',
      id: itemIds[1],
      attributes: {
        title: 'iPhone 6',
        price: 101
      },
      relationships: {
        category: {
          data: {
            type: 'Category',
            id: categoryId
          }
        }
      }
    },
    {
      type: 'Item',
      id: itemIds[2],
      attributes: {
        title: 'iPhone 5S',
        price: 102
      },
      relationships: {
        category: {
          data: {
            type: 'Category',
            id: categoryId
          }
        }
      }
    }
  ]
};

server.connection({
  host: process.env.IP || '0.0.0.0',
  port: process.env.PORT || 3000
});

function getOne(type, id) {
  return data[type].filter(function(item) { return item.id === id; }).shift();
}

function getAll(type) {
  return data[type];
}

function filterByRelationship(name, id) {
  return function (item) {
    return item.relationships[name].data.id === id;
  };
}

server.route({
  method: 'GET',
  path: '/api/categories/{id}',
  handler: function (request, reply) {
    reply({
      data: getOne('Category', request.params.id),
      included: getAll('Avatar').concat(getAll('Item'))
    });
  }
});

server.route({
  method: 'GET',
  path: '/api/items',
  handler: function (request, reply) {
    reply({
      data: getAll('Item').filter(filterByRelationship('category', request.query.filter.category))
    });
  }
});

server.route({
  method: 'POST',
  path: '/api/items',
  handler: function (request, reply) {
    const item = request.payload.data;
    item.id = getUniqueId();
    data['Item'].push(item);
    const category = getOne('Category', item.relationships.category.data.id);
    category.relationships.items.data.push({type: 'Item', id: item.id});
    reply({
      data: item,
      included: [category]
    });
  }
});

server.route({
  method: 'PUT',
  path: '/api/items/{id}',
  handler: function (request, reply) {
    const item = getOne('Item', request.params.id);
    if (!item) {
      return reply({data: null}).code(404);
    }
    if (request.payload.data.attributes.price > 105) {
      return reply({
        errors: [{title: 'Price is too large'}]
      });
    }
    item.attributes.price = request.payload.data.attributes.price;
    reply({
      data: item
    });
  }
});

server.route({
  method: 'DELETE',
  path: '/api/items/{id}',
  handler: function (request, reply) {
    const item = getOne('Item', request.params.id);
    data.Item = data.Item.filter(function(i) { return i.id !== item.id; });
    const category = getOne('Category', item.relationships.category.data.id);
    category.relationships.items.data = category.relationships.items.data.filter(function(i) { return i.id !== item.id; });
    reply({
      data: null,
      included: [category]
    });
  }
});

server.start();
