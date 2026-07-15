// ============================================================
// Real-Time World Chat Component - Socket.io
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { Send, MessageSquare, X, Shield, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const WorldChat = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (!socket) return

    // Receive message history
    socket.on('chat:history', (history) => {
      setMessages(history)
      scrollToBottom()
    })

    // Receive new messages
    socket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg])
      scrollToBottom()
    })

    return () => {
      socket.off('chat:history')
      socket.off('chat:message')
    }
  }, [socket])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [isOpen, messages])

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    if (!socket) return toast.error('Chat connection lost')

    socket.emit('chat:message', text.trim())
    setText('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-dark-700/95 backdrop-blur-xl border-l border-brand-700/20 z-50 flex flex-col shadow-2xl animate-slide-left">
      {/* Header */}
      <div className="p-4 border-b border-dark-300/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-400" />
          <div>
            <h3 className="font-bold text-white text-sm">Global Chat</h3>
            <p className="text-xxs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Online
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages list */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
        {messages.map((msg) => {
          const isMe = msg.username === user?.username
          return (
            <div key={msg.id} className={`flex gap-2.5 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-300 font-bold text-xs flex-shrink-0">
                  {msg.username?.[0]?.toUpperCase()}
                </div>
              )}

              <div className="max-w-[70%] space-y-1">
                <div className={`flex items-center gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xxs font-bold text-slate-400 truncate">{msg.username}</span>
                  {msg.username === 'admin' && <Shield className="w-3 h-3 text-red-400" />}
                </div>
                <div dir="ltr" className={`p-3 rounded-2xl text-xs leading-relaxed break-words text-left
                  ${isMe
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-dark-500 text-slate-200 rounded-tl-none border border-white/5'
                  }`}
                >
                  {msg.text}
                </div>
              </div>

              {isMe && (
                <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-300 font-bold text-xs flex-shrink-0">
                  {msg.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-dark-300/30 flex gap-2">
        <input
          type="text"
          placeholder="Type message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-field text-xs py-2 flex-1"
          maxLength={300}
        />
        <button type="submit" className="btn-primary p-2 rounded-xl flex items-center justify-center">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

export default WorldChat
