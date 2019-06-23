const { unpack, types, write } = require('@rooms/protocol')

const createSocket = (url, options = {}, WebSocket) => {
  let ws = null
  let timer = null
  let attempt = 0
  let online = false

  const fns = new Map()
  const { token, timeout = 1e3, attempts = Infinity, pingInterval = 10000, params = {} } = options

  const toQs = data => {
    return Object.keys(data)
      .map(key => key + '=' + data[key])
      .join('&')
  }

  const connect = () => {
    if (token) params.token = token
    const socketUrl = url + '?' + toQs(params)
    ws = new WebSocket(socketUrl)
    ws.binaryType = 'arraybuffer'
    ws.addEventListener('message', onMessage)
    ws.onclose = onClose
    ws.addEventListener('error', onError)
    ws.addEventListener('open', onOpen)
  }

  const onOpen = () => {
    online = true
    emit('connect')
  }

  const onMessage = ({ data: payload }) => {
    const { type, data } = unpack(payload)

    if (type === types.PING) {
      ws.send(types.PONG)
      return resetPing(emit('ping'))
    }

    if (type === types.ID) {
      Object.assign(ws, data)
      return emit('ready')
    }

    emit('message', { type, data })
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
    write(ws, type, data)
  }

  const on = (id, fn) => {
    fns.set(id, [...(fns.get(id) || []), fn])
    return () => off(id, fn)
  }

  const off = (id, fn) => {
    if (!fn) return fns.delete(id)
    if (fns.has(id)) fns.set(id, fns.get(id).filter(cb => cb !== fn))
  }

  const emit = (id, ...args) => {
    if (fns.has(id)) fns.get(id).map(fn => fn(...args))
    if (fns.has('*')) fns.get('*').map(fn => fn(id, ...args))
  }

  const close = () => {
    online = false
    ws.close()
    fns.clear()
  }

  const reconnect = () => {
    if (attempt++ > attempts || !online) return
    setTimeout(() => connect(emit('reconnect', [attempt])), timeout)
  }

  const resetPing = () => {
    clearTimeout(timer)
    timer = setTimeout(() => ws.close(4001), pingInterval)
  }

  connect()

  return { ws, on, off, emit, send, close }
}

module.exports = createSocket
