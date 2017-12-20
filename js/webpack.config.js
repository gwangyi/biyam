const path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: ['babel-polyfill', './src/index.js'],
  output: {
    filename: '[name].js',
    publicPath: '/nbextensions/biyam/',
    path: path.resolve(__dirname, '../biyam/static'),
    libraryTarget: 'amd',
  },

  resolve: {
    alias: {
      'i18n': path.resolve(__dirname, './lib/i18n'),
      'interpreter$': path.resolve(__dirname, './lib/interpreter.js')
    }
  },

  module: {
    rules: [{
      enforce: 'pre',
      test: /\.js$/,
      loader: 'eslint-loader',
      exclude: /node_modules|i18n/
    }, {
      test: /\.(xml|html)$/,
      loader: 'text-loader',
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader',
    }, {
      test: /\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/env'],
          plugins: ["syntax-dynamic-import"]
        }
      },
      exclude: /node_modules/,
    }],

    loaders: [{
      test: require.resolve('arrive'),
      loader: 'imports-loader?this=>window',
    }],
  },

  externals: [
    'jquery',
    /^base\/js\//,
    /^notebook\/js\//,
  ],

  plugins: [
    //new webpack.optimize.UglifyJsPlugin({minimize: true})
  ],

  devtool: 'source-map'
};
