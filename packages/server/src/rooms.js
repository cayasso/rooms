const emitter = require('component-emitter')

const createRoom = (ns, options = {}) => {
  const { send, roomTimeout } = options
  const room = emitter({})
  const socks = new Map()

  let timer = null

  room.ns = ns

  room.auth = fn => {
    if (typeof fn !== 'function') {
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
    if (socks.size > 0) return
    timer = setTimeout(room.dispose, roomTimeout)
  }

  room.send = (id, data) => {
    if (!data && id && typeof id !== 'string') {
      data = id
      id = null
    }

    const args = [ns, data]
    if (id) args.push(id)
    send(...args)
  }

  room.dispose = () => {
    socks.clear()
    room.emit('dispose')
    process.nextTick(() => room.removeAllListeners())
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
    const room = rooms.get(ns) || createRoom(ns, { ...options, ...params })
    rooms.set(ns, room)
    return room
  }
}
