'use strict'

global.cws = {
  EventEmitter: require('events').EventEmitter
}

const nanoid = require('nanoid')
const UrlPattern = require('url-pattern')
const { WebSocketServer } = require('@clusterws/cws')
const { write } = require('@rooms/protocol')
const pkg = require('../package.json')
const config = require('../config')
const createTransport = require('./transports')
const { makeError, merge, parseUrl } = require('./utils')
const createRooms = require('./rooms')
const createBus = require('./bus')
const createManager = require('./manager')

const createServer = (options = {}) => {
  options = { ...config, ...options }
  const { pingInterval = 5000 } = options

  const routes = new Map()

  if (!options.transport) {
    options.transport = createTransport('redis', options.redis)
  }

  if (!options.bus) {
    options.bus = createBus(options)
  }

  if (!options.rooms) {
    options.rooms = createRooms(options)
  }

  /**
   * Find route.
   *
   * @param {String} path
   * @return {Object|Undefined}
   * @private
   */

  const findRoute = path => {
    for (const [route, [pattern, handler, options]] of routes) {
      const params = pattern.match(path)
      if (params) {
        return { params, route, handler, options, found: true }
      }
    }
  }

  /**
   * Verify client request.
   *
   * @param {Object} req
   * @param {Function} next
   * @return {Void}
   * @private
   */

  const verifyClient = async ({ req }, next) => {
    try {
      const { pathname: ns, query: qs } = parseUrl(req)
      const { token, ...query } = qs
      const foundRoute = findRoute(ns)
      if (!foundRoute) throw makeError('Not found', 404)

      const { route, params = {}, handler: fn, options = {} } = foundRoute
      const data = { query, params, route, ns }

      if (options.auth) {
        try {
          data.user = await options.auth(token)
        } catch (error) {
          throw makeError(error.message, error.code || 401)
        }
      }

      req.ns = ns
      req.fn = room => fn({ ...data, room })
      next(true)
    } catch (error) {
      console.log(error.message)
      next(false, error.code || 400, error.message || 'Unknown error')
    }
  }

  /**
   * Called upon client connection.
   *
   * @params {Socket} socket
   * @params {Request} req
   * @return {Void}
   * @private
   */

  const onConnection = async (server, manage, socket, req = {}) => {
    server.clients.push(socket)

    // Parse and get room info from request
    const { id = nanoid(12), ns, fn } = req
    const meta = { id, ns }

    // Set local socket room information
    merge(socket, meta)

    // Send transport socket room metadata to client
    write(socket, 'id', meta)

    // Manage socket live cicle
    manage(socket, fn)

    console.log('client connecting', socket.id)

    socket.on('close', () => {
      socket.removeAllListeners()
      const i = server.clients.findIndex(c => c === socket)
      server.clients.splice(i, 1)
      console.log('client disconnecting', socket.id)
    })

    // Important for keep alive
    socket.on('pong', () => {
      socket.isAlive = true
    })
  }

  /**
   * Called upon server close.
   *
   * @return {Void}
   * @private
   */

  const onClose = () => {
    console.log('Server closed')
    options.transport.close()
  }

  /**
   * Start listening.
   *
   * @params {String} port
   * @params {String} host
   * @return {Void}
   * @private
   */

  const listen = (port, host) => {
    if (port) options = { ...options, port }
    if (host) options = { ...options, host }

    const server = new WebSocketServer({ verifyClient, ...options })
    server.clients = []
    const manage = createManager(server, options)
    server.on('connection', onConnection.bind(null, server, manage))
    server.on('close', onClose)
    server.startAutoPing(pingInterval, true)

    console.log('\n')
    console.log('-----------------------------------------------------')
    console.log(' SERVICE     : ' + pkg.name)
    console.log(' PORT        : ' + options.port)
    console.log(' VERSION     : ' + pkg.version)
    console.log(' ENVIRONMENT : ' + options.env)
    console.log(' STARTED     : ' + new Date())
    console.log('-----------------------------------------------------')
    console.log('\n')
  }

  /**
   * Register a room.
   *
   * @params {String} route
   * @params {Function} handler
   * @params {Object} options
   * @return {Void}
   * @private
   */

  const room = (route, handler, options = {}) => {
    const pattern = new UrlPattern(route)
    routes.set(route, [pattern, handler, options])
  }

  return { listen, room }
}

module.exports = createServer
