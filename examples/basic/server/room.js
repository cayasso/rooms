module.exports = ({ room, ...args }) => {
  room.on('join', id => {
    console.log('JOINED', id)
    room.send(id, { message: 'hola mundo' })
  })

  room.on('leave', (...args) => {
    console.log('LEFT', args)
  })

  room.on('data', (...args) => {
    console.log('DATA', args)
  })

  room.on('dispose', (...args) => {
    console.log('DISPOSED', args)
  })
}
