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
        type: 'category',
        id: request.params.id,
        title: 'Phones',
        subtitle: 'Mobile phones',
        links: {
          items: {
            linkage: [
              {type: 'item', id: '1'},
              {type: 'item', id: '2'},
              {type: 'item', id: '3'}
            ]
          }
        }
      },
      included: [
        {type: 'item', id: '1', title: 'iPhone 6 Plus'},
        {type: 'item', id: '2', title: 'iPhone 6'},
        {type: 'item', id: '3', title: 'iPhone 5S'}
      ]
    });
  }
});

server.start();
