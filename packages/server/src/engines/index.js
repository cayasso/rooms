'use strict'

const { makeError } = require('../utils')

const engines = {
  memory: require('./memory'),
  redis: require('./redis')
}

module.exports = (type, options = {}) => {
  const engine = engines[type]

  if (!engine) {
    throw makeError('Invalid engine')
  }

  if (type === 'redis') {
    options = options.redis
  }

  return engine(options)
}
