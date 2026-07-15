// ============================================================
// Direct Messages Page - ColorVerse Platform
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'
import { MessageSquare, Search, Send, Image as ImageIcon, X, AlertCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const Messages = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  
  const [activePartner, setActivePartner] = useState(null) // username
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [conversations, setConversations] = useState([]) // list of usernames we talked to
  
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [image, setImage] = useState('') // Base64 image
  
  const chatEndRef = useRef(null)

  // Listen to incoming direct messages
  useEffect(() => {
    if (!socket) return

    // Load message history response
    socket.on('chat:private_history', ({ receiverUsername, messages: history }) => {
      setMessages(history)
      scrollToBottom()
    })

    // Listen to new incoming messages
    socket.on('chat:private_receive', ({ chatPartner, message }) => {
      // Add chat partner to conversation list if not exists
      setConversations(prev => {
        if (!prev.includes(chatPartner)) {
          return [chatPartner, ...prev]
        }
        return prev
      })

      // If we are currently talking to this partner, add to message list
      if (activePartner === chatPartner || message.sender === user?.username) {
        setMessages(prev => [...prev, message])
        scrollToBottom()
      } else {
        toast.success(`💬 New message from ${chatPartner}!`, { duration: 3000 })
      }
    })

    return () => {
      socket.off('chat:private_history')
      socket.off('chat:private_receive')
    }
  }, [socket, activePartner])

  // Get private history when active partner changes
  useEffect(() => {
    if (activePartner && socket) {
      socket.emit('chat:get_private_history', { receiverUsername: activePartner })
    }
  }, [activePartner, socket])

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Handle Search users
  const handleSearch = async (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const res = await api.get(`/users/search?q=${query}`)
      // filter out ourself
      const list = (res.users || []).filter(u => u.username !== user?.username)
      setSearchResults(list)
    } catch {}
  }

  // Handle image attachment
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      return toast.error('Image size must be less than 2MB')
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImage(reader.result) // Base64 data url
    }
    reader.readAsDataURL(file)
  }

  // Handle Send Direct Message
  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim() && !image) return
    if (!socket) return toast.error('Socket disconnected')

    socket.emit('chat:send_private_message', {
      receiverUsername: activePartner,
      text: text.trim(),
      image
    })

    setText('')
    setImage('')
  }

  const selectConversation = (partner) => {
    setActivePartner(partner)
    setSearchResults([])
    setSearchQuery('')
  }

  return (
    <div className="glass-card flex h-[calc(100vh-140px)] overflow-hidden border border-brand-700/20 rounded-2xl animate-fade-in">
      {/* Left Sidebar: Conversations and search */}
      <div className={`border-r border-dark-300/30 flex flex-col bg-dark-800/40 transition-all duration-300 ${activePartner ? 'hidden md:flex w-80' : 'flex w-full md:w-80'}`}>
        {/* Search */}
        <div className="p-4 border-b border-dark-300/30 relative">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search username..."
            value={searchQuery}
            onChange={handleSearch}
            className="input-field pl-10 text-xs"
          />

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-4 right-4 mt-2 bg-dark-700 border border-slate-700 rounded-xl z-20 overflow-hidden shadow-2xl">
              {searchResults.map(u => (
                <div
                  key={u._id}
                  onClick={() => selectConversation(u.username)}
                  className="p-3 hover:bg-dark-600 cursor-pointer text-xs font-semibold text-white flex items-center gap-2 border-b border-slate-800 last:border-0"
                >
                  <div className="w-6 h-6 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-300 font-bold text-xxs">
                    {u.username[0].toUpperCase()}
                  </div>
                  {u.username}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          <p className="text-slate-500 text-xxs font-bold uppercase tracking-wider px-2 mb-2">Chats</p>
          {conversations.length > 0 ? conversations.map(partner => (
            <div
              key={partner}
              onClick={() => setActivePartner(partner)}
              className={`p-3.5 rounded-xl cursor-pointer transition flex items-center gap-3
                ${activePartner === partner
                  ? 'bg-brand-600/30 border border-brand-500/40 text-white shadow-glow-sm'
                  : 'hover:bg-dark-600/40 border border-transparent text-slate-400 hover:text-white'
                }`}
            >
              <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-300 font-bold text-sm flex-shrink-0">
                {partner[0].toUpperCase()}
              </div>
              <span className="font-semibold text-xs truncate">{partner}</span>
            </div>
          )) : (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-2">
              <MessageSquare className="w-8 h-8 opacity-30" />
              <p className="text-xxs">Search username above to start a chat!</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Message Window */}
      <div className={`flex-col justify-between bg-dark-900/30 transition-all duration-300 ${activePartner ? 'flex w-full' : 'hidden md:flex flex-1'}`}>
        {activePartner ? (
          <>
            {/* Active Partner Header */}
            <div className="p-4 border-b border-dark-300/30 flex items-center gap-3 bg-dark-800/20">
              <button
                onClick={() => setActivePartner(null)}
                className="md:hidden p-1 bg-dark-500 hover:bg-dark-400 text-white rounded-lg transition mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-9 h-9 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-300 font-bold text-sm">
                {activePartner[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{activePartner}</h3>
                <p className="text-xxs text-emerald-400 font-medium">Direct Messages</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar">
              {messages.map(msg => {
                const isMe = msg.sender === user?.username
                return (
                  <div key={msg.id} className={`flex gap-2.5 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-300 font-bold text-xs flex-shrink-0">
                        {msg.sender?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="max-w-[65%] space-y-1">
                      <div className={`flex items-center gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xxs font-bold text-slate-400">{msg.sender}</span>
                      </div>
                      <div dir="ltr" className={`p-3 rounded-2xl text-xs leading-relaxed break-words text-left space-y-2
                        ${isMe
                          ? 'bg-brand-600 text-white rounded-tr-none'
                          : 'bg-dark-500 text-slate-200 rounded-tl-none border border-white/5'
                        }`}
                      >
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="attachment"
                            className="max-w-xs rounded-lg border border-slate-700/50 max-h-48 object-cover bg-black"
                          />
                        )}
                        {msg.text && <p>{msg.text}</p>}
                      </div>
                    </div>
                    {isMe && (
                      <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-600/40 flex items-center justify-center text-brand-300 font-bold text-xs flex-shrink-0">
                        {msg.sender?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Attachment preview */}
            {image && (
              <div className="p-3 bg-dark-800 border-t border-dark-300/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={image} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-700" />
                  <span className="text-slate-400 text-xs font-semibold">Image attached</span>
                </div>
                <button onClick={() => setImage('')} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-dark-300/30 flex gap-2">
              <label className="btn-secondary p-2.5 rounded-xl flex items-center justify-center cursor-pointer hover:text-white transition">
                <ImageIcon className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                placeholder="Type message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input-field text-xs flex-1 py-2.5"
                maxLength={300}
              />
              <button type="submit" className="btn-primary px-4 py-2 rounded-xl flex items-center justify-center gap-1.5">
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
            <MessageSquare className="w-16 h-16 opacity-20" />
            <p className="text-sm font-semibold">No active chat selected</p>
            <p className="text-xs text-slate-600">Select a chat on the left sidebar or search users to start messaging!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Messages
