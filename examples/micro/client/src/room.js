import React, { useEffect, useContext, useState, useRef } from 'react'
import { createContext } from 'react'
import createRoom from '@rooms/client'

const Context = createContext({
  room: null,
  online: false
})

export const useRoom = () => {
  const { room, ...data } = useContext(Context)
  return { ...data, room: room.current }
}

export const RoomProvider = ({ url, params, children }) => {
  const [online, setOnline] = useState(false)
  const room = useRef({})

  useEffect(() => {
    setOnline(false)

    room.current = createRoom(url, { params })

    room.current.on('ready', () => {
      setOnline(true)
    })

    room.current.on('close', () => {
      setOnline(false)
    })
  }, [url, params])

  return <Context.Provider value={{ room, online }}>{children}</Context.Provider>
}

RoomProvider.defaultProps = {
  params: {}
}
