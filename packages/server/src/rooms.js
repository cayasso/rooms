const emitter = require('component-emitter')
const { isFunction, isNumber } = require('./utils')

const createRoom = (ns, { bus, roomTimeout, disableRoomTimeout, rooms } = {}) => {
  const room = emitter({})
  const socks = new Map()

  let timer = null

  room.ns = ns

  room.auth = fn => {
    if (!isFunction(fn)) {
      return error('Invalid auth function')
    }
  }

  room.join = (id, data = {}) => {
    if (!id) {
      return error('Invalid id')
    }

    socks.set(id, data)
    room.emit('join', id, data)
    if (timer) clearTimeout(timer)
  }

  room.data = (id, data) => {
    room.emit('data', id, data)
  }

  room.leave = id => {
    if (!id) {
      return error('Invalid id')
    }

    socks.delete(id)
    room.emit('leave', id)
    if (socks.size > 0 || disableRoomTimeout) return
    timer = setTimeout(room.dispose, roomTimeout)
  }

  room.send = (to, data) => {
    if (to && !data) {
      data = to
      to = []
    }

    bus.sendData({ data, to })
  }

  room.sendError = (to, message, code = 400) => {
    if (to && !message) {
      message = to
      to = []
    }

    if (message && isNumber(message)) {
      code = message
      message = to
      to = []
    }

    bus.sendError({ data: [message, code], to })
  }

  room.to = to => {
    if (!Array.isArray(to)) to = [to]
    return { send: data => bus.sendData({ data, to }) }
  }

  room.not = not => {
    if (!Array.isArray(not)) not = [not]
    return { send: data => bus.sendData({ data, not }) }
  }

  room.dispose = () => {
    socks.clear()
    room.emit('dispose')

    process.nextTick(() => {
      room.removeAllListeners()
      rooms.delete(ns)
    })
  }

  const error = message => {
    room.emit('error', new Error(message))
  }

  return room
}

module.exports = (options = {}) => {
  const rooms = new Map()

  return (ns, params = {}) => {
    if (!ns) ns = '*'
    const room = rooms.get(ns) || createRoom(ns, { ...options, ...params, rooms })
    rooms.set(ns, room)
    return room
  }
}
