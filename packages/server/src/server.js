const Emitter = require('component-emitter')

global.cws = {
  EventEmitter: Emitter
}

module.exports = (options = {}, cb) => {
  const { pingInterval = 5000 } = options
  const { WebSocketServer } = require('@clusterws/cws')
  const server = new WebSocketServer(options, cb)
  server.clients = []

  server.on('connection', async socket => {
    server.clients.push(socket)

    socket.on('close', () => {
      socket.removeAllListeners()
      const i = server.clients.findIndex(c => c === socket)
      server.clients.splice(i, 1)
    })

    // Important for keep alive
    socket.on('pong', () => {
      socket.isAlive = true
    })
  })

  server.startAutoPing(pingInterval, true)

  return server
}
