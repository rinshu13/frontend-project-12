import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  token: localStorage.getItem('token') || null,
  username: localStorage.getItem('username') || null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      const { token, username } = action.payload
      if (token && typeof token === 'string' && username && typeof username === 'string') {
        state.token = token
        state.username = username
        localStorage.setItem('token', token)
        localStorage.setItem('username', username)
      } 
      else {
        console.error('Invalid login payload:', action.payload)
      }
    },
    logout: (state) => {
      state.token = null
      state.username = null
      localStorage.removeItem('token')
      localStorage.removeItem('username')
    },
    initAuth: (state) => {
      const token = localStorage.getItem('token')
      const username = localStorage.getItem('username')
      if (token && username && !state.token) {
        state.token = token
        state.username = username
      }
    },
  },
})

export const { login, logout, initAuth } = authSlice.actions
export default authSlice.reducer
