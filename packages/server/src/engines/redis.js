'use strict'

const Redis = require('ioredis')
const { sleep, encode, decode } = require('../utils')

module.exports = ({ url, ...options } = {}) => {
  const args = url ? [url, options] : [options]
  const sub = new Redis(...args)
  const pub = new Redis(...args)

  const fns = {}

  const subscribe = (ns, fn) => {
    fns[ns] = (ch, msg) => {
      if (ns !== ch) return
      fn(decode(msg))
    }

    sub.on('message', fns[ns])
    return sub.subscribe(ns)
  }

  const unsubscribe = ns => {
    sub.off('message', fns[ns])
    delete fns[ns]
    return sub.unsubscribe(ns)
  }

  const publish = (ns, data = false) => {
    return pub.publish(ns, encode(data))
  }

  const exist = async ns => {
    const channels = await pub.pubsub('channels', ns)
    return Boolean(channels.length)
  }

  const delay = async ns => {
    const key = `${ns}:d`
    const concurrency = await pub.incr(key)

    if (concurrency > 1) {
      // Avoid having too long timeout if 10+ clients ask to join at the same time
      const timeout = Math.min(concurrency * 10, 4000)
      return sleep(timeout)
    }

    pub.expire(key, 1)
    return true
  }

  const close = () => {
    pub.disconnect()
    sub.disconnect()
  }

  return { delay, subscribe, unsubscribe, publish, exist, close }
}
