const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

var config = {
  plugins: [
    new HtmlWebpackPlugin({
      template: './app/index.html',
      filename: 'index.html',
      inject: 'body',
      hash: false,
      minify: {
        collapseWhitespace: true
      }
    }),
    new UglifyJSPlugin({
      sourceMap: false
    })
  ],
  module: {
    loaders: [
      {
        test: /\.json$/,
        use: 'json-loader'
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        }
      }
    ]
  },
  node: {
    fs: 'empty',
    child_process: 'empty'
  }
};

var mainConfig = Object.assign({}, config, {
  name: 'main',
  entry: './app/frontend/main.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'main.[hash].js'
  }
});

var translatorConfig = Object.assign({}, config, {
  name: 'translator',
  entry: './app/frontend/translator.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'translator.[hash].js'
  }
});

var voucherConfig = Object.assign({}, config, {
  name: 'voucher',
  entry: './app/frontend/vouchers.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'vouchers.[hash].js'
  }
});

module.exports = [
   voucherConfig
];
// mainConfig, translatorConfig,
