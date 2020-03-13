const { TypewizPlugin } = require('typewiz-webpack');

const CommonWebpack = require('./webpack.config.common');

const rules = [
  ...CommonWebpack.module.rules,
  {
    test: /\.ts$/,
    use: 'typewiz-webpack',
    exclude: /node_modules/
  }
];

module.exports = {
  ...CommonWebpack,
  entry: './output/Evaporate.ts',
  plugins: [new TypewizPlugin()],
  module: { rules }
};
