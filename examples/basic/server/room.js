module.exports = (room, data) => {
  console.log('CREATED', room, data)

  room.on('join', (id, data) => {
    console.log('JOINED', id, data)
    room.send({ message: 'hola mundo' }, id)
  })

  room.on('leave', (...args) => {
    console.log('LEFT', args)
  })

  room.on('data', (id, data) => {
    console.log('DATA', id, data)
  })

  room.on('dispose', (...args) => {
    console.log('DISPOSED', args)
  })
}
