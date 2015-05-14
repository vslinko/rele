var port = process.env.PORT || 3000;
var host = process.env.IP || '0.0.0.0';

process.env.PORT = port + 1;
process.env.IP = 'localhost';

require('./server');

var WebpackDevServer = require('webpack-dev-server');
var webpack = require('webpack');
var config = require('./webpack.config');

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  contentBase: __dirname + '/public',
  proxy: {
    '/api*': 'http://localhost:' + process.env.PORT
  }
}).listen(port, host);
