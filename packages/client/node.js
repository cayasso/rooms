const createRoom = require('./src')

module.exports = (url, options) => {
  const { WebSocket } = require('@clusterws/cws')
  return createRoom(url, options, WebSocket)
}
