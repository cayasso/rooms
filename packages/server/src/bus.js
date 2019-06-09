const emitter = require('component-emitter')

module.exports = ({ engine }) => {
  const bus = emitter({})

  const onEvent = (ns, data) => {
    bus.emit(`e:${ns}`, data)
  }

  const onCommand = async (ns, data) => {
    bus.emit(`c:${ns}`, data)
  }

  bus.send = (ns, ...args) => {
    bus.publish(ns, 'event', ...args)
  }

  bus.publish = (ns, type, ...args) => {
    engine.publish(`e:${ns}`, [type, ...args])
  }

  bus.call = (ns, id, data) => {
    engine.publish(`c:${ns}`, { ...data, id })
  }

  bus.bind = ns => {
    // Bind event and command handler
    const onRemoteEvent = onEvent.bind(null, ns)
    const onRemoteCommand = onCommand.bind(null, ns)

    // Subscribe to event and command channels
    engine.subscribe(`e:${ns}`, onRemoteEvent)
    engine.subscribe(`c:${ns}`, onRemoteCommand)

    return () => {
      process.nextTick(() => {
        engine.unsubscribe(`e:${ns}`, onRemoteEvent)
        engine.unsubscribe(`c:${ns}`, onRemoteCommand)
        bus.removeAllListeners(`e:${ns}`)
        bus.removeAllListeners(`c:${ns}`)
      })
    }
  }

  return bus
}
