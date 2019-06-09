'use strict'

const nanoid = require('nanoid')
const UrlPattern = require('url-pattern')
const { write } = require('@rooms/protocol')
const pkg = require('../package.json')
const config = require('../config')
const { makeError, merge, parseUrl } = require('./utils')
const createEngines = require('./engines')
const createManager = require('./manager')
const createServer = require('./server')
const createRooms = require('./rooms')
const createBus = require('./bus')

module.exports = (options = {}) => {
  options = { ...config, ...options }
  const { engine = 'memory' } = options
  const routes = new Map()

  if (typeof engine === 'string') {
    options.engine = createEngines(engine, options)
  }

  if (!options.engine || typeof options.engine !== 'object') {
    throw makeError('Invalid engine provided')
  }

  if (!options.bus) {
    options.bus = createBus(options)
  }

  if (!options.rooms) {
    options.rooms = createRooms(options)
  }

  const findRoute = path => {
    for (const [route, [pattern, handler, options]] of routes) {
      const params = pattern.match(path)
      if (params) {
        return { params, route, handler, options, found: true }
      }
    }
  }

  const verifyClient = async ({ req }, next) => {
    try {
      const { pathname: ns, query: qs } = parseUrl(req)
      const { token, ...query } = qs
      const foundRoute = findRoute(ns)
      if (!foundRoute) throw makeError('Not found', 404)

      const { route, handler, params = {}, options = {} } = foundRoute
      const data = { query, params, route, ns }

      if (options.auth) {
        try {
          req.user = await options.auth(token)
        } catch (error) {
          throw makeError(error.message, error.code || 401)
        }
      }

      req.query = query
      req.ns = ns
      req.handler = room => handler({ ...data, room })
      next(true)
    } catch (error) {
      console.log(error.message)
      next(false, error.code || 400, error.message || 'Unknown error')
    }
  }

  const room = (route, handler, options = {}) => {
    const pattern = new UrlPattern(route)
    routes.set(route, [pattern, handler, options])
  }

  const listen = (port, host) => {
    if (port) options = { ...options, port }
    if (host) options = { ...options, host }

    const server = createServer({ verifyClient, ...options })
    const manage = createManager(server, options)

    server.on('connection', async (socket, { id = nanoid(12), ns, user, query, handler }) => {
      merge(socket, { id, ns, user, query })
      write(socket, 'id', { id, ns })
      manage(socket, handler)
      console.log('client connecting', socket.id)
    })

    server.on('close', () => {
      console.log('Server closed')
      options.engine.close()
    })

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

  return { room, listen }
}
