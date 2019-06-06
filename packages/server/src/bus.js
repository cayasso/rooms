const emitter = require('component-emitter')
const { encode, decode } = require('./utils')

module.exports = ({ transport }) => {
  const bus = emitter({})

  const onEvent = (ns, data) => {
    bus.emit(`e:${ns}`, decode(data))
  }

  const onCommand = async (ns, data) => {
    bus.emit(`c:${ns}`, decode(data))
  }

  bus.send = (ns, ...args) => {
    bus.publish(ns, 'event', ...args)
  }

  bus.publish = (ns, type, ...args) => {
    transport.publish(`e:${ns}`, encode([type, ...args]))
  }

  bus.call = (ns, id, data) => {
    transport.publish(`c:${ns}`, encode({ ...data, id }))
  }

  bus.bind = ns => {
    // Bind event and command handler
    const onRemoteEvent = onEvent.bind(null, ns)
    const onRemoteCommand = onCommand.bind(null, ns)

    // Subscribe to event and command channels
    transport.subscribe(`e:${ns}`, onRemoteEvent)
    transport.subscribe(`c:${ns}`, onRemoteCommand)

    return () => {
      process.nextTick(() => {
        transport.unsubscribe(`e:${ns}`, onRemoteEvent)
        transport.unsubscribe(`c:${ns}`, onRemoteCommand)
        bus.removeAllListeners(`e:${ns}`)
        bus.removeAllListeners(`c:${ns}`)
      })
    }
  }

  return bus
}
