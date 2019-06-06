const { unpack, types, write } = require('./protocol')

const createSocket = (url, options = {}, WebSocket) => {
  let socket = null
  let attempt = 0
  let online = false
  let timer = null

  const fns = new Map()
  const { token, timeout = 1e3, attempts = Infinity, pingInterval = 10000, params = {} } = options

  const merge = data => {
    Object.assign(socket, data)
  }

  const toQs = data => {
    return Object.keys(data)
      .map(key => key + '=' + data[key])
      .join('&')
  }

  const connect = () => {
    const socketUrl = url + '?' + toQs({ ...params, token })
    socket = new WebSocket(socketUrl)
    socket.binaryType = 'arraybuffer'
    socket.addEventListener('message', onMessage)
    socket.onclose = onClose
    socket.addEventListener('error', onError)
    socket.addEventListener('open', onOpen)
  }

  const onOpen = () => {
    online = true
    emit('connect')
  }

  const onMessage = ({ data: payload }) => {
    const { type, data } = unpack(payload)

    console.log('incoming message', type, data)

    switch (type) {
      case types.PING:
        socket.send(types.PONG)
        emit('ping')
        return resetPing()
      case types.ID:
        merge(data)
        return
      default:
        break
    }

    emit('data', { type, data })
  }

  const onClose = data => {
    clearTimeout(timer)
    emit('close', data)
    return data && (data.code !== 410 || data.reason !== 'disposed') ? reconnect() : close()
  }

  const onError = data => {
    emit('error', data)
  }

  const send = (type, data) => {
    write(socket, type, data)
  }

  const on = (id, fn) => {
    fns.set(id, [...(fns.get(id) || []), fn])
    return () => off(id, fn)
  }

  const off = (id, fn) => {
    if (!fn) return fns.delete(id)
    fns.set(id, fns.get(id).filter(cb => cb !== fn))
  }

  const emit = (id, ...args) => {
    if (fns.has(id)) fns.get(id).map(fn => fn(...args))
    if (fns.has('*')) fns.get('*').map(fn => fn(id, ...args))
  }

  const close = () => {
    online = false
    socket.close()
    fns.clear()
  }

  const reconnect = () => {
    if (attempt++ > attempts || !online) return
    setTimeout(() => connect(emit('reconnect', [attempt])), timeout)
  }

  const resetPing = () => {
    clearTimeout(timer)
    timer = setTimeout(() => socket.close(4001), pingInterval)
  }

  connect()

  return { on, off, emit, send, close }
}

module.exports = createSocket
