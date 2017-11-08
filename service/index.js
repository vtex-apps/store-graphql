require('ts-node').register({
  fast: true,
  project: __dirname,
})
module.exports = require('./main.ts')
