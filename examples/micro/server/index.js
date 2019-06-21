const micro = require('micro')
const createServer = require('@rooms/server')
const room = require('./room')
const wsServer = createServer()

const PORT = 9000

const route = async () => {
  return 'Welcome to rooms'
}

const server = wsServer.attach(micro(route))

wsServer.room('/:id', room)

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})
