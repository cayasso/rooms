'use strict'

const qs = require('querystring')
const makeLogger = require('debug')

/**
 * Check to see if an array or object is empty.
 *
 * @param {String} obj
 * @return {Function}
 * @type public
 */

const debug = ns => makeLogger(`regatta:${ns}`)
const log = debug('error')

/**
 * Get difference between two objects.
 *
 * @param {Object} o1
 * @param {Object} o2
 * @return {Object} diff
 * @type public
 */

const diff = (o1, o2) => {
  return Object.keys(o2).reduce((diff, key) => {
    if (o1[key] === o2[key]) {
      return diff
    }

    return { ...diff, [key]: o2[key] }
  }, {})
}

/**
 * Make error.
 *
 * @param {String} message
 * @return {Error}
 * @type public
 */

const makeError = (message, code = 400) => {
  log('error %s', message)
  const error = new Error(message)
  error.message = message
  error.code = code
  return error
}

/**
 * Merge objects.
 *
 * @param {Object} src
 * @param {Object} obj
 * @return {String}
 * @public
 */

const merge = (src, ...args) => {
  return Object.assign(src, ...args)
}

/**
 * Delay and return promise.
 *
 * @param {Number} time
 * @return {Promise}
 * @public
 */

const sleep = time => {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

/**
 * Encode data.
 *
 * @param {Object} data
 * @return {String}
 * @public
 */

const encode = (data = false) => {
  try {
    return JSON.stringify(data)
  } catch (error) {
    console.log(error)
    return ''
  }
}

/**
 * Decode data.
 *
 * @param {Object} data
 * @return {Object}
 * @public
 */

const decode = data => {
  try {
    return JSON.parse(data)
  } catch (error) {
    console.log(error)
    return null
  }
}

/**
 * Parse url from request.
 *
 * @param {Object} req
 * @return {Object}
 * @public
 */

const parseUrl = ({ url, headers }) => {
  const [path, _qs] = url.split('?')
  const query = qs.parse(_qs)
  const parsedUrl = new URL(path, headers.origin)
  parsedUrl.query = query
  return parsedUrl
}

/**
 * Cast string to boolean.
 *
 * @param {String} value
 * @return {Boolean}
 * @public
 */

const toBoolean = value => {
  return !/^(false|0)$/i.test(value) && Boolean(value)
}

module.exports = {
  log,
  diff,
  merge,
  debug,
  sleep,
  encode,
  decode,
  parseUrl,
  toBoolean,
  makeError
}
