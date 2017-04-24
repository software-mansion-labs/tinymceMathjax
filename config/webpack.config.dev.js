const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path');

console.log(path.dirname(__dirname));

module.exports = {
  context: path.dirname(__dirname),
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: './static/index.html'
    })
  ],
  devServer: {
    proxy: {
      "/plugins/tinymceMathjax": {
        target: "http://localhost:8080",
        pathRewrite: {"^/plugins/tinymceMathjax": ""}
      },
    }
  }
}
