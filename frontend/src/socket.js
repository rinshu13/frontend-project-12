import { io } from 'socket.io-client'
import { store } from './store'
import { addMessage } from './features/messages/messagesSlice'
import { setChannels, setCurrentChannelId } from './features/channels/channelsSlice'

let socket = null

export const connectSocket = (token) => {
  if (socket) return socket

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || ''

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    timeout: 20000,
  })

  socket.on('newMessage', (payload) => {
    store.dispatch(addMessage(payload.message || payload))
  })

  socket.on('newChannel', (payload) => {
    const channelData = payload.data || payload
    const attributes = channelData.attributes || channelData

    const newChannel = {
      id: channelData.id,
      name: attributes.name,
      removable: attributes.removable ?? true,
    }

    const currentChannels = store.getState().channels.channels
    store.dispatch(setChannels([...currentChannels, newChannel]))
  })

  socket.on('renameChannel', (payload) => {
    const channelData = payload.data || payload
    const attributes = channelData.attributes || channelData

    const updatedId = channelData.id
    const updatedName = attributes.name

    const currentChannels = store.getState().channels.channels
    const updatedChannels = currentChannels.map(channel =>
      channel.id === updatedId ? { ...channel, name: updatedName, } : channel
    )

    store.dispatch(setChannels(updatedChannels))
  }),

  socket.on('removeChannel', (payload) => {
    const channelId = payload.data?.id || payload.id

    const currentChannels = store.getState().channels.channels
    const filteredChannels = currentChannels.filter(channel => channel.id !== channelId)

    store.dispatch(setChannels(filteredChannels))

    const currentChannelId = store.getState().channels.currentChannelId
    if (currentChannelId === channelId) {
      store.dispatch(setCurrentChannelId(1))
    }
  })

  socket.on('connect_error', (err) => {
    console.error('Socket connect error:', err.message)
  })

  socket.on('connect', () => {
    console.log('Socket connected successfully')
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const promisifyEmit = (event, data) => {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not connected'))
      return
    }

    socket.emit(event, data, (ack) => {
      if (ack && ack.error) {
        reject(new Error(ack.error))
      } 
      else {
        resolve(ack)
      }
    })
  })
}

export const joinChannel = async (channelId) => {
  try {
    await promisifyEmit('joinChannel', { channelId })
    console.log('Joined channel:', channelId)
  } 
  catch (error) {
    console.error('Join channel error:', error)
  }
}

export const leaveChannel = async (channelId) => {
  try {
    await promisifyEmit('leaveChannel', { channelId })
    console.log('Left channel:', channelId)
  } 
  catch (error) {
    console.error('Leave channel error:', error)
  }
}

export const emitNewMessage = async (data) => {
  try {
    await promisifyEmit('newMessage', data)
    console.log('Message emitted:', data)
  } 
  catch (error) {
    console.error('Emit message error:', error)
    throw error
  }
}
