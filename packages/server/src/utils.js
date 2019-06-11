'use strict'

const qs = require('querystring')
const makeLogger = require('debug')

const debug = (ns = '') => makeLogger(`rooms:${ns}`)
const log = debug('error')

const makeError = (message, code = 400) => {
  log('error %s', message)
  const error = new Error(message)
  error.message = message
  error.code = code
  return error
}

const merge = (src, ...args) => {
  return Object.assign(src, ...args)
}

const sleep = time => {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

const encode = (data = false) => {
  try {
    return JSON.stringify(data)
  } catch (error) {
    console.log(error)
    return ''
  }
}

const decode = data => {
  try {
    return JSON.parse(data)
  } catch (error) {
    console.log(error)
    return null
  }
}

const parseUrl = ({ url, headers }) => {
  const [path, _qs] = url.split('?')
  const query = qs.parse(_qs)
  const parsedUrl = new URL(path, headers.origin)
  parsedUrl.query = query
  return parsedUrl
}

const toBoolean = value => {
  return !/^(false|0)$/i.test(value) && Boolean(value)
}

const isFunction = value => {
  return typeof value === 'function'
}

const isString = value => {
  return typeof value === 'string'
}

const isNumber = value => {
  return typeof value === 'number'
}

const isObject = value => {
  return value !== null && typeof value === 'object'
}

module.exports = {
  log,
  merge,
  debug,
  sleep,
  encode,
  decode,
  parseUrl,
  toBoolean,
  makeError,
  isFunction,
  isNumber,
  isObject,
  isString
}
