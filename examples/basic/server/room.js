module.exports = (room, data) => {
  console.log('CREATED', room, data)

  room.on('join', (id, data) => {
    console.log('JOINED', id, data)
    room.send(id, { message: 'joined' })
  })

  room.on('leave', id => {
    console.log('LEFT', id)
  })

  room.on('data', (id, data) => {
    console.log('DATA', id, data)
    room.send(data)
  })

  room.on('dispose', (...args) => {
    console.log('DISPOSED', args)
  })
}
