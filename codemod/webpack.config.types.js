const path = require('path')

const { TypewizPlugin, typewizCollectorMiddleware } = require('typewiz-webpack')

const CommonWebpack = require('./webpack.config.common')

const typewizConfig = path.resolve(__dirname, './typewiz.json')

const rules = [
  {
    test: /\.ts$/,
    use: [
      CommonWebpack.module.rules[0].use,
      {
        loader: 'typewiz-webpack',
        options: { typewizConfig }
      }
    ],
    exclude: /node_modules/
  }
]

module.exports = {
  ...CommonWebpack,
  plugins: [new TypewizPlugin()],
  module: { rules },
  devServer: {
    before: function(app) {
      typewizCollectorMiddleware(app, 'collected-types.json')
    },
    contentBase: 'dist'
  }
}
