const Emitter = require('component-emitter')
const { WebSocketServer } = require('@clusterws/cws')
const { makeError, merge, parseUrl, isFunction, debug } = require('./utils')

const log = debug('server')

global.cws = {
  EventEmitter: Emitter
}

module.exports = (routes, options = {}, cb) => {
  const { pingInterval = 5000 } = options

  if (!options.routeMatch) {
    options.routeMatch = (pattern, path) => pattern.match(path)
  }

  if (!isFunction(options.routeMatch)) {
    throw makeError('Invalid routeMatch function provided')
  }

  if (options.auth && !isFunction(options.auth)) {
    throw makeError('Invalid auth function provided')
  }

  if (options.verifyClient && !isFunction(options.verifyClient)) {
    throw makeError('Invalid verifyClient function provided')
  }

  const findRoute = path => {
    for (const [route, [pattern, handler, opt]] of routes) {
      const params = options.routeMatch(pattern, path)
      if (params) return { params, route, handler, options: opt }
    }
  }

  const verifyRoute = req => {
    const { pathname, query: qs } = parseUrl(req)
    const { token, ...query } = qs
    const route = findRoute(pathname)
    if (!route) throw makeError('Not found', 404)
    return { ...route, token, query, ns: pathname }
  }

  const verifyToken = async (req, token, options) => {
    if (!options.auth) return
    log('verifying token', token)
    try {
      req.user = await options.auth(token)
    } catch (error) {
      throw makeError(error.message || 'Invalid token', error.code || 401)
    }
  }

  const verifyClient = async ({ req }, next) => {
    try {
      const { ns, route, handler, params, query, token, options: opt } = verifyRoute(req)
      const data = { ns, route, params, query }

      await verifyToken(req, token, opt)

      merge(req, { ns, query, params, handler: room => handler(room, data) })

      if (options.verifyClient) {
        options.verifyClient(req)
        log('executing custom verifyClient')
      }

      next(true)
    } catch (error) {
      next(false, error.code || 400, error.message || 'Unknown error')
      log(error)
    }
  }

  const server = new WebSocketServer({ ...options, verifyClient }, cb)
  server.clients = []

  server.on('connection', async (socket, ...args) => {
    server.clients.push(socket)

    socket.on('close', () => {
      socket.removeAllListeners()
      const i = server.clients.findIndex(c => c === socket)
      server.clients.splice(i, 1)
    })

    server.emit('connect', socket, ...args)

    // Important for keep alive
    socket.on('pong', () => {
      socket.isAlive = true
    })
  })

  server.on('close', () => {
    log('server closed')
    options.engine.close()
  })

  server.startAutoPing(pingInterval, true)

  return server
}
