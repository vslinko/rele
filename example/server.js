var Hapi = require('hapi');

var server = new Hapi.Server();

var id = 1;
function getUniqueId() {
  return String(id++);
}

const categoryId = getUniqueId();
const itemIds = [getUniqueId(), getUniqueId(), getUniqueId()];

const data = {
  Category: [
    {
      type: 'Category',
      id: categoryId,
      title: 'Phones',
      subtitle: 'Mobile phones',
      links: {
        items: {
          linkage: [
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
      title: 'iPhone 6 Plus',
      links: {
        category: {
          linkage: {
            type: 'Category',
            id: categoryId
          }
        }
      }
    },
    {
      type: 'Item',
      id: itemIds[1],
      title: 'iPhone 6',
      links: {
        category: {
          linkage: {
            type: 'Category',
            id: categoryId
          }
        }
      }
    },
    {
      type: 'Item',
      id: itemIds[2],
      title: 'iPhone 5S',
      links: {
        category: {
          linkage: {
            type: 'Category',
            id: categoryId
          }
        }
      }
    }
  ]
};

server.connection({
  host: '0.0.0.0',
  port: 3000
});

function getOne(type, id) {
  return data[type].filter(function(item) { return item.id === id; }).shift();
}

function getAll(type) {
  return data[type];
}

function filterByLink(name, id) {
  return function (item) {
    return item.links[name].linkage.id === id;
  };
}

server.route({
  method: 'GET',
  path: '/api/categories/{id}',
  handler: function (request, reply) {
    reply({
      data: getOne('Category', request.params.id)
    });
  }
});

server.route({
  method: 'GET',
  path: '/api/items',
  handler: function (request, reply) {
    reply({
      data: getAll('Item').filter(filterByLink('category', request.query.filter.category))
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
    reply({
      data: item
    });
  }
});

server.start();
