'use strict'

const { types, unpack, broadcast } = require('@rooms/protocol')
const { debug } = require('./utils')
const createBus = require('./bus')

const log = debug('manager')

const createManager = (server, options) => {
  const { engine, transform, rooms, terminateOnDispose, terminateDisposeTimeout } = options
  const DEFAULT_ERROR_MESSAGE = 'Unknown error'
  const DEFAULT_ERROR_CODE = 400
  const getBus = createBus(options)

  const sendCommand = (ns, id, data) => {
    getBus(ns).call(id, data)
  }

  const sendEvent = (ns, type, data, to = [], not = []) => {
    if (type === types.DISPOSE && terminateOnDispose) {
      setTimeout(terminate, terminateDisposeTimeout, ns)
    }

    log('broadcasting %s to %s with %j', type, ns, data, to, not)
    return broadcast(server, ns, type, data, { to, not, transform })
  }

  const terminate = ns => {
    server.clients.forEach(socket => {
      if (socket.ns === ns) socket.close(410, 'disposed')
    })
  }

  const onMessage = (ns, id, data) => {
    sendCommand(ns, id, unpack(data) || {})
  }

  const onEvent = (room, [type, data, to, not]) => {
    sendEvent(room.ns, type, data, to, not)
  }

  const onCommand = async (room, { type, id, data }) => {
    data = data || {}
    log('incoming command %s from %s with %j', type, id, data)

    try {
      switch (type) {
        case types.JOIN:
          return await room.join(id, data)
        case types.LEAVE:
          return await room.leave(id, data)
        case types.DATA:
          return await room.data(id, data)
        default:
          break
      }
    } catch (error) {
      error = error || {}
      if (!error.code) error.code = DEFAULT_ERROR_CODE
      if (!error.message) error.message = DEFAULT_ERROR_MESSAGE

      console.log(error)
      sendEvent(room.ns, types.ERROR, [error.message, error.code], id)
    }
  }

  const createRoom = async (ns, handler = () => {}) => {
    const bus = getBus(ns)
    const room = await rooms(ns, { bus })
    bus.on('event', onEvent.bind(null, room))
    bus.on('command', onCommand.bind(null, room))
    room.on('dispose', () => setTimeout(bus.dispose, 1000))
    handler(room)
  }

  return async (socket, handler) => {
    const { id, ns, user, query } = socket

    // Avoid race condition
    await engine.delay(ns)

    // Check if room listener exist
    if (!(await engine.exist(`c:${ns}`))) {
      await createRoom(ns, handler)
    }

    const data = { ...query }

    if (user) data.user = user

    log('client %s joining room %s with data %j', id, ns, data)
    sendCommand(ns, id, { type: types.JOIN, data })
    socket.on('disconnect', () => sendCommand(ns, id, { type: types.LEAVE }))
    return socket.on('message', onMessage.bind(null, ns, id))
  }
}

module.exports = createManager
