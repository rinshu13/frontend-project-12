import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export const sendMessage = async (data) => {
    return api.post('/messages', data)
}

export const fetchMessagesByChannel = async (channelId) => {
    return api.get(`/messages?channelId=${channelId}`)
}

export const getChannels = async () => {
    return api.get('/channels')
}

export const createChannel = async (name) => {
    return api.post('/channels', {
        data: {
            type: 'channels',
            attributes: { name },
        },
    })
}

export const deleteChannel = async (channelId) => {
    return api.delete(`/channels/${channelId}`)
}

export const renameChannel = async (channelId, name) => {
    return api.patch(`/channels/${channelId}`, { name })
}

export const loginUser = async (credentials) => {
    return api.post('/login', credentials)
}

export const signupUser = async (credentials) => {
    return api.post('/signup', credentials)
}

export default api
