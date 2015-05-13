var Hapi = require('hapi');

var server = new Hapi.Server();

server.connection({
  host: '0.0.0.0',
  port: 3000
});

server.route({
  method: 'GET',
  path: '/api/categories/{id}',
  handler: function (request, reply) {
    reply({
      data: {
        type: 'Category',
        id: request.params.id,
        title: 'Phones',
        subtitle: 'Mobile phones',
        links: {
          items: {
            linkage: [
              {type: 'Item', id: '1'},
              {type: 'Item', id: '2'},
              {type: 'Item', id: '3'}
            ]
          }
        }
      }
    });
  }
});

server.route({
  method: 'GET',
  path: '/api/items',
  handler: function (request, reply) {
    reply({
      data: [
        {type: 'Item', id: '1', title: 'iPhone 6 Plus', links: {category: {linkage: {type: 'Category', id: request.query.filter.category}}}},
        {type: 'Item', id: '2', title: 'iPhone 6', links: {category: {linkage: {type: 'Category', id: request.query.filter.category}}}},
        {type: 'Item', id: '3', title: 'iPhone 5S', links: {category: {linkage: {type: 'Category', id: request.query.filter.category}}}}
      ]
    });
  }
});

server.start();
