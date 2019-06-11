'use strict'

const nanoid = require('nanoid')
const UrlPattern = require('url-pattern')
const { write } = require('@rooms/protocol')
const config = require('../config')
const { debug, makeError, merge, isString, isFunction, isObject } = require('./utils')
const createEngine = require('./engines')
const createManager = require('./manager')
const createServer = require('./server')
const createRooms = require('./rooms')
const createBus = require('./bus')

const log = debug()

module.exports = (options = {}) => {
  options = { ...config, ...options }
  const { engine = 'memory' } = options
  const routes = new Map()

  if (isString(engine)) {
    options.engine = createEngine(engine, options)
  }

  if (!options.engine || !isObject(options.engine)) {
    throw makeError('Invalid engine provided')
  }

  if (!options.bus) {
    options.bus = createBus(options)
  }

  if (!options.rooms) {
    options.rooms = createRooms(options)
  }

  const room = (route, handler, options = {}) => {
    const pattern = new UrlPattern(route)
    routes.set(route, [pattern, handler, options])
  }

  const listen = (port, host, cb) => {
    if (isFunction(port)) {
      cb = port
      port = undefined
      host = undefined
    }

    if (isFunction(host)) {
      cb = host
      host = undefined
    }

    if (port) options = { ...options, port }
    if (host) options = { ...options, host }

    const server = createServer(routes, options, cb)
    const manage = createManager(server, options)

    server.on('connect', async (socket, { id = nanoid(12), ns, user, query, handler }) => {
      merge(socket, { id, ns, user, query })
      write(socket, 'id', { id, ns })
      manage(socket, handler)
      log('client connected', socket.id)
    })
  }

  return { room, listen }
}
