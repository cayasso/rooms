'use strict'

const { makeError } = require('../utils')
const redis = require('./redis')

const transports = {
  redis
}

const createTransports = (type = 'redis', options = {}) => {
  const transport = transports[type]
  if (!transport) {
    throw makeError('Invalid transport')
  }

  return transport(options)
}

module.exports = createTransports
