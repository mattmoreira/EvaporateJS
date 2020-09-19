const ChildProcessPlugin = require('child-process-webpack-plugin')
const BuildWebpack = require('./webpack.config.build')

const testProcess = new ChildProcessPlugin('npm run test:runner')

module.exports = {
  ...BuildWebpack,
  mode: 'development',
  stats: 'errors-only',
  plugins: [...BuildWebpack.plugins, testProcess],
  devtool: 'inline-source-map',
  output: {
    ...BuildWebpack.output,
    filename: 'Evaporate.js'
  }
}
