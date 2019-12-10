const createRoom = require('./src')

module.exports = (url, options) => {
  let WebSocket

  try {
    WebSocket = require('@clusterws/cws').WebSocket
  } catch (error) {
    WebSocket = require('ws')
  }

  return createRoom(url, options, WebSocket)
}
