'use strict'

const Emitter = require('component-emitter')

const event = new Emitter()

module.exports = () => {
  const subscribe = (ns, fn) => {
    event.on(ns, fn)
  }

  const unsubscribe = ns => {
    event.off(ns)
  }

  const publish = (ns, data = false) => {
    return event.emit(ns, data)
  }

  const exist = async ns => {
    return event.hasListeners(ns)
  }

  const delay = async () => {
    return true
  }

  const close = () => {
    event.off()
  }

  return { delay, subscribe, unsubscribe, publish, exist, close }
}
