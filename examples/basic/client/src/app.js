import React, { useEffect } from 'react'
import { RoomProvider, useRoom } from './room'
import './app.css'

const getRoomId = () => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('room')
}

const roomId = getRoomId()

const Room = () => {
  const { room, online } = useRoom()

  useEffect(() => {
    if (!online) return

    const unbind1 = room.on('data', (type, data) => {
      console.log('incoming data', type, data)
    })

    const unbind2 = room.on('error', (type, data) => {
      console.log('incoming error', type, data)
    })

    return () => {
      unbind1()
      unbind2()
    }
  }, [online, room])

  const onMessage = () => {
    room.send({ message: 'hola mundo' })
  }

  if (!online) return <div>loading...</div>

  console.log(room)

  return (
    <div className="root">
      <h2>Room {room.id}</h2>
      <h4>Client {room.cid}</h4>

      <div>
        <div className="flex">
          <button onClick={onMessage}>Send Message</button>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  const url = `ws://localhost:9000/${roomId}`

  return (
    <RoomProvider url={url} params={{ one: 1, two: 2 }}>
      <Room />
    </RoomProvider>
  )
}

export default App
