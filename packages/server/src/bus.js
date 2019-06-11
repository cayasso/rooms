const emitter = require('component-emitter')
const { types } = require('@rooms/protocol')

module.exports = ({ engine }) => {
  const cache = new Map()

  return ns => {
    if (cache.has(ns)) return cache.get(ns)

    const bus = emitter({})

    const bind = () => {
      engine.subscribe(`e:${ns}`, onEvent)
      engine.subscribe(`c:${ns}`, onCommand)

      return () => {
        process.nextTick(() => {
          engine.unsubscribe(`e:${ns}`, onEvent)
          engine.unsubscribe(`c:${ns}`, onCommand)
          bus.removeAllListeners()
        })
      }
    }

    const onEvent = data => {
      bus.emit('event', data)
    }

    const onCommand = async data => {
      bus.emit('command', data)
    }

    bus.send = (type, data = {}, to = [], not = []) => {
      engine.publish(`e:${ns}`, [type, data, to, not])
    }

    bus.call = (id, data) => {
      engine.publish(`c:${ns}`, { ...data, id })
    }

    bus.sendJoin = data => {
      bus.send(types.JOIN, data)
    }

    bus.sendData = ({ data, to, not }) => {
      bus.send(types.DATA, data, to, not)
    }

    bus.sendLeave = data => {
      bus.send(types.LEAVE, data)
    }

    bus.sendError = ({ data, to, not }) => {
      bus.send(types.ERROR, data, to, not)
    }

    bus.dispose = () => {
      bus.send(types.DISPOSE)
      process.nextTick(() => unbind(cache.delete(ns)))
    }

    const unbind = bind()
    cache.set(ns, bus)

    return bus
  }
}
