module.exports = ({ room, ...args }) => {
  room.on('join', id => {
    console.log('JOINED', id)
    room.send({ message: 'hola mundo' }, id)
  })

  room.on('leave', (...args) => {
    console.log('LEFT', args)
  })

  room.on('data', (id, data) => {
    console.log('DATA', data)
    //room.sendError('Invalid', 400, id)

    throw new Error('PATACON')
  })

  room.on('dispose', (...args) => {
    console.log('DISPOSED', args)
  })
}
