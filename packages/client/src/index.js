const { types } = require('@rooms/protocol')
const createSocket = require('./socket')

const createRoom = (url, options = {}, WebSocket) => {
  let socket = null

  const { autoConnect = true } = options

  const connect = () => {
    socket = createSocket(url, options, WebSocket)
    socket.on('message', onMessage)
  }

  const send = data => {
    socket.send(types.DATA, data)
  }

  const args = (event, cb) => {
    if (typeof event === 'function') {
      cb = event
      event = '*'
    }

    return [event, cb]
  }

  const on = (type, fn) => {
    const [event, cb] = args(type, fn)
    return cb ? socket.on(event, cb) : cb => on(event, cb)
  }

  const off = (type, fn) => {
    const [event, cb] = args(type, fn)
    socket.off(event, cb)
  }

  const close = () => {
    socket.close()
  }

  const onMessage = ({ type, data }) => {
    switch (type) {
      case types.DATA:
        return onData(data)
      case types.EVENT:
        return onEvent(data)
      case types.JOIN:
        return onEvent(['join', ...data])
      case types.LEAVE:
        return onEvent(['leave', ...data])
      case types.DISPOSE:
        return onEvent(['dispose', ...data])
      case types.ERROR:
        return onError(data)
      default:
        break
    }
  }

  const onData = data => {
    socket.emit('data', data)
  }

  const onEvent = ([event, data, userId]) => {
    if (!event) return
    socket.emit(event, data, userId)
  }

  const onError = ([message, code]) => {
    socket.emit('error', { message, code })
  }

  if (autoConnect) {
    connect()
  }

  return {
    on,
    off,
    send,
    close,
    connect,
    ws: socket.ws,
    get id() {
      return socket.ws.ns
    },
    get cid() {
      return socket.ws.id
    }
  }
}

module.exports = createRoom
