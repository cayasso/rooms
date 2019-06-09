/* eslint no-undef: "off" */
const createRoom = require('./src')

// PAPARAS
module.exports = (url, options) => {
  let WS = null

  if (typeof WebSocket !== 'undefined') {
    WS = WebSocket
  } else if (typeof MozWebSocket !== 'undefined') {
    WS = MozWebSocket
  } else if (typeof global !== 'undefined') {
    WS = global.WebSocket || global.MozWebSocket
  } else if (typeof window !== 'undefined') {
    WS = window.WebSocket || window.MozWebSocket
  } else if (typeof self !== 'undefined') {
    WS = self.WebSocket || self.MozWebSocket
  }

  return createRoom(url, options, WS)
}
