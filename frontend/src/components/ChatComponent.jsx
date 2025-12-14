// src/components/ChatComponent.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import leoProfanity from 'leo-profanity'
import { setMessages } from '../features/messages/messagesSlice'
import './Components.css'
import '../App.css' // если нужны стили из App.css

const ChatComponent = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const inputRef = useRef(null)

  const { token, username, currentChannelId } = useSelector((state) => ({
    token: state.auth.token,
    username: state.auth.username,
    currentChannelId: state.channels.currentChannelId,
  }))

  const [messageText, setMessageText] = useState('')
  const [messageError, setMessageError] = useState(null)
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [messages, setLocalMessages] = useState([])

  useEffect(() => {
    if (currentChannelId && token) {
      const stored = localStorage.getItem(`messages_${currentChannelId}`)
      let list = stored ? JSON.parse(stored) : []

      if (list.length === 0) {
        list = [
          { id: 1, text: t('chat.welcomeMessage'), username: 'System', createdAt: new Date(Date.now() - 3600000).toISOString() },
          { id: 2, text: t('chat.demoMessage'), username: 'DemoUser', createdAt: new Date().toISOString() },
        ]
        localStorage.setItem(`messages_${currentChannelId}`, JSON.stringify(list))
        toast.info(t('app.demoMessages'))
      }

      setLocalMessages(list)
      dispatch(setMessages(list))
    }
  }, [currentChannelId, token, dispatch, t])

  const validateMessage = useCallback((text) => {
    if (!text?.trim()) return t('validation.messageRequired')
    if (text.trim().length > 500) return t('validation.messageTooLong')
    if (leoProfanity.check(text)) return t('validation.profanityDetected')
    return null
  }, [t])

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    const error = validateMessage(messageText)
    if (error) {
      setMessageError(error)
      return
    }

    setLoading(true)
    let text = messageText.trim()
    if (leoProfanity.check(text)) {
      text = leoProfanity.clean(text)
      toast.warning(t('toast.warning.profanity'))
    }

    const newMsg = {
      id: Date.now(),
      text,
      username,
      createdAt: new Date().toISOString(),
    }

    const updated = [...messages, newMsg]
    setLocalMessages(updated)
    dispatch(setMessages(updated))
    localStorage.setItem(`messages_${currentChannelId}`, JSON.stringify(updated))

    setMessageText('')
    setMessageError(null)
    setTouched(false)
    setLoading(false)
    inputRef.current?.focus()
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message-card">
            <div className="message-header">
              <strong>{msg.username}</strong>
            </div>
            <div className="message-body">{msg.text}</div>
            <div className="message-footer">
              {new Date(msg.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="chat-form" noValidate>
        <input
          ref={inputRef}
          type="text"
          placeholder={t('chat.inputPlaceholder')}
          aria-label="Новое сообщение"
          className={`chat-input ${touched && messageError ? 'invalid' : ''}`}
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value)
            if (touched) setMessageError(validateMessage(e.target.value))
          }}
          onBlur={() => {
            setTouched(true)
            setMessageError(validateMessage(messageText))
          }}
          disabled={!currentChannelId || loading}
          autoFocus
        />
        {touched && messageError && (
          <div className="modal-invalid-feedback">{messageError}</div>
        )}
        <button
          type="submit"
          className="chat-submit-btn"
          disabled={loading || !messageText.trim() || !!messageError}
        >
          {loading ? 'Отправка...' : t('chat.sendButton')}
        </button>
      </form>
    </div>
  )
}

export default ChatComponent