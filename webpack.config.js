var webpack = require('webpack');
var React = require('react');
var path = require("path");

var APP_DIR = path.resolve(__dirname, 'src');
var DIST_DIR = path.resolve(__dirname, 'dist');

module.exports = {
  debug: true,
  entry: [
  	 './src',
  ],
  output: {
  	path: DIST_DIR,
  	filename: 'app.js'
  },
  module: {
    loaders: [
      { test: /\.jsx$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      },
    ]
  },
  externals: {
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  plugins: [

  ]
};