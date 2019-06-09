'use strict'

const { types, unpack, broadcast } = require('@rooms/protocol')

const createManager = (server, options) => {
  const { engine, transform, rooms, bus, terminateOnDispose, terminiateDisposeTimeout } = options
  const EVENT = 'event'
  const DISPOSE = 'dispose'

  /**
   * Send command to room via redis.
   *
   * @param {String} ns
   * @param {String} id
   * @param {Object} data
   * @return {Void}
   * @private
   */

  const sendCommand = (ns, id, data) => {
    bus.call(ns, id, data)
  }

  /**
   * Terminate all room client connections.
   *
   * @param {String} ns
   * @return {Void}
   * @private
   */

  const terminate = ns => {
    server.clients.forEach(socket => {
      if (socket.ns === ns) socket.close(410, 'disposed')
    })
  }

  /**
   * Send (broadcast) event from redis to client.
   *
   * @param {String} ns
   * @param {String} type
   * @param {Object} data
   * @param {String} id
   * @return {Void}
   * @private
   */

  const sendEvent = (ns, type, data = [], id) => {
    if (data.length > 2 && (type === EVENT || type === types.EVENT)) {
      const aud = data.pop()
      if (Array.isArray(aud) && aud.length > 0) {
        return aud.forEach(id => sendEvent(ns, type, data, id))
      }

      id = aud
    }

    if (type === DISPOSE && terminateOnDispose) {
      setTimeout(terminate, terminiateDisposeTimeout, ns)
    }

    return broadcast(server, ns, type, data, id, transform)
  }

  /**
   * Send command to room via redis.
   *
   * @param {String} ns
   * @param {String} id
   * @param {Object} data
   * @return {Void}
   * @private
   */

  const onMessage = (ns, id, data) => {
    sendCommand(ns, id, unpack(data) || {})
  }

  /**
   * Called upon inconming event from redis.
   *
   * @param {String} ns
   * @param {Object} data
   * @return {Void}
   * @private
   */

  const onEvent = (ns, [type, ...data]) => {
    sendEvent(ns, type, type === EVENT ? [type, ...data] : data)
  }

  /**
   * Called upon incoming command from redis.
   *
   * @param {String} ns
   * @param {Object} room
   * @param {Object} payload
   * @return {Void}
   * @private
   */

  const onCommand = async (ns, room, { type, id, data }) => {
    console.log('incoming command', type, id, data)
    data = data || {}

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
      console.log(error)

      if (!error) {
        error = { code: 400, message: 'Unknown error' }
      }

      sendEvent(ns, 'error', [error.code, error.message], id)
    }
  }

  /**
   * Create/get a new room from store.
   *
   * @param {String} ns
   * @param {Object} params
   * @return {Void}
   * @private
   */

  const createRoom = async (ns, handler = () => {}) => {
    console.log('loading room', ns)
    const room = await rooms(ns, { send: bus.send })
    const onRemoteEvent = onEvent.bind(null, ns)
    const onRemoteCommand = onCommand.bind(null, ns, room)
    bus.on(`e:${ns}`, onRemoteEvent)
    bus.on(`c:${ns}`, onRemoteCommand)
    const unbindBusEvents = bus.bind(ns)

    room.on(DISPOSE, () => {
      bus.publish(ns, DISPOSE)
      setTimeout(unbindBusEvents, 1000)
    })

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

    // Send a join command to the room
    sendCommand(ns, id, { type: types.JOIN, data })
    socket.on('close', () => sendCommand(ns, id, { type: types.LEAVE }))
    return socket.on('message', onMessage.bind(null, ns, id))
  }
}

module.exports = createManager
