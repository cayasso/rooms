const { encode, decode } = require('notepack.io')

const OPEN = 1
const CLOSED = 0

const types = {
  ID: 1,
  DATA: 2,
  EVENT: 3,
  ERROR: 4,
  JOIN: 5,
  LEAVE: 6,
  DISPOSE: 7,
  PING: 57,
  PONG: new Uint8Array(['A'.charCodeAt()])
}

const hasArrayBuffer = typeof ArrayBuffer === 'function'
const { toString } = Object.prototype
const isString = str => typeof str === 'string'

/**
 * Check if the given value is an ArrayBuffer.
 * @param {*} value
 * @return {Boolean}
 */

const isArrayBuffer = value => {
  return (
    hasArrayBuffer &&
    (value instanceof ArrayBuffer || toString.call(value) === '[object ArrayBuffer]')
  )
}

/**
 * Get protocol message type.
 * @param {Number|String} type
 * @return {Number}
 */

const getType = type => {
  return isString(type) ? types[type.toUpperCase()] : type
}

/**
 * Serialize data as binary format to be send over websocket.
 *
 * @params {String|Number} type
 * @params {Object} data
 * @return {Buffer}
 * @public
 */

const packet = (type, data) => {
  type = getType(type)
  if (!type) return
  const pack = [type]
  if (data) pack.push(data)
  return encode(pack)
}
/**
 * Parse serialized incoming websocket payload.
 *
 * @params {ArrayBuffer|Buffer} payload
 * @return {Object}
 * @private
 */

const unpack = payload => {
  if (isString(payload)) {
    return { type: types.DATA, data: payload }
  }

  if (isArrayBuffer(payload)) {
    payload = Buffer.from(payload)
  }

  payload = decode(payload)

  if (payload === types.PING) {
    return { type: payload }
  }

  if (!Array.isArray(payload)) {
    return { type: types.DATA, data: payload }
  }

  const [type, data] = payload
  return { type, data }
}

/**
 * Send data to a websocket client.
 *
 * @params {Object} socket
 * @params {String|Number} type
 * @params {Object} data
 * @params {Boolean} packed
 * @return {Void}
 * @public
 */

const write = (socket, type, data, packed) => {
  if (!socket || socket.readyState !== OPEN) return
  type = getType(type)
  if (!type) return
  const payload = packed ? data : packet(type, data)
  return socket.send(payload)
}

module.exports = {
  OPEN,
  CLOSED,
  types,
  packet,
  unpack,
  write
}
