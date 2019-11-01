'use strict'

const ms = require('ms')
const rc = require('rc')
const { toBoolean } = require('./src/utils')

module.exports = rc('rooms', {
  port: process.env.PORT || 9000,
  redis: {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || '127.0.0.1',
    password: process.env.REDIS_PASSWORD || ''
  },
  roomTimeout: ms(process.env.ROOM_TIMEOUT || '30s'),
  terminateDisposeTimeout: ms(process.env.TERMINATE_DISPOSE_TIMEOUT || '30s'),
  terminateOnDispose: toBoolean(process.env.TERMINATE_ON_DISPOSE || true),
  disableRoomTimeout: toBoolean(process.env.DISABLE_ROOM_TIMEOUT || false),
  wsEngine: 'cws'
})
