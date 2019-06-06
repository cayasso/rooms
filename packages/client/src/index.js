const { types } = require('./protocol')
const createSocket = require('./socket')

const createRoom = (url, options = {}, WebSocket) => {
  const state = {}
  let socket = null

  const { autoConnect = true } = options

  const connect = () => {
    socket = createSocket(url, options, WebSocket)
    socket.on('data', onData)
    socket.on('connect', onConnect)
  }

  const merge = data => {
    return Object.assign(state, data)
  }

  const sync = data => {
    data = merge(data)
    socket.emit('state', data)
    //socket.emit('*', 'state', data)
  }

  const send = (event, data) => {
    const payload = [event]
    if (data) payload.push(data)
    socket.send(types.DATA, payload)
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

  const onConnect = () => {
    return setTimeout(sync, 500)
  }

  const onData = ({ type, data }) => {
    switch (type) {
      case types.EVENT:
        return onEvent(data)
      case types.JOIN:
        return onEvent(['join', ...data])
      case types.LEAVE:
        return onEvent(['leave', ...data])
      case types.DISPOSE:
        return onEvent(['dispose', ...data])
      case types.SYNC:
        return onSync(data)
      case types.ERROR:
        return onError(data)
      default:
        break
    }
  }

  const onEvent = ([event, data, userId]) => {
    if (event) {
      socket.emit(event, data, userId)
      //socket.emit('*', event, data, userId)
    }
  }

  const onSync = data => {
    return sync(data)
  }

  const onError = ([code, message]) => {
    socket.emit('error', { code, message })
    //socket.emit('*', 'error', { code, message })
  }

  if (autoConnect) {
    connect()
  }

  return { on, off, sync, send, close, connect }
}

module.exports = createRoom
