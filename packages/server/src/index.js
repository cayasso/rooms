'use strict'

const UrlPattern = require('url-pattern')
const config = require('../config')
const { debug, makeError, isString, isFunction, isObject } = require('./utils')
const createEngine = require('./engines')
const createManager = require('./manager')
const createServer = require('./server')
const createRooms = require('./rooms')

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

  if (!options.rooms) {
    options.rooms = createRooms(options)
  }

  const room = (route, handler, options = {}) => {
    if (isFunction(route)) {
      if (isObject(handler)) {
        options = handler
      }

      handler = route
      route = '/'
    }

    if (!isFunction(handler)) {
      throw makeError('Invalid room handler')
    }

    if (!isObject(options)) {
      throw makeError('Invalid room options')
    }

    const pattern = new UrlPattern(route)
    routes.set(route, [pattern, handler, options])
  }

  const create = (options, cb) => {
    const server = createServer(routes, { ...options }, cb)
    const manage = createManager(server, options)

    server.on('connect', async (socket, { handler }) => {
      manage(socket, handler)
      log('client connected', socket.id)
    })

    return server
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

    return create(options, cb)
  }

  const attach = server => {
    create({ ...options, server })
    return server
  }

  return { room, attach, listen }
}
