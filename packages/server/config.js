'use strict'

const ms = require('ms')
const rc = require('rc')
const { toBoolean } = require('./src/utils')

module.exports = rc('regatta', {
  audience: ['app', 'cms', 'web'],
  port: process.env.PORT || 9000,
  secret: process.env.API_SECRET || 'secret',
  mongo: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/regatta-development'
  },
  redis: {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || '127.0.0.1',
    password: process.env.REDIS_PASSWORD || ''
  },
  env: process.env.NODE_ENV || 'development',
  tickInterval: ms(process.env.TICK_INTERVAL || '1s'),
  roomTimeout: ms(process.env.ROOM_TIMEOUT || '10s'),
  terminiateDisposeTimeout: ms(process.env.TERMINATE_DISPOSE_TIMEOUT || '10s'),
  terminateOnDispose: toBoolean(process.env.TERMINATE_ON_DISPOSE || false)
})
