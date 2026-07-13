// ============================================================
// Socket Context - ColorVerse Frontend
// ============================================================
import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const useSocket = () => useContext(SocketContext)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/'

export const SocketProvider = ({ children }) => {
  const { token, updateWallet } = useAuth()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [currentGame, setCurrentGame] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [lastResult, setLastResult] = useState(null)
  const [recentRounds, setRecentRounds] = useState([])

  const socketRef = useRef(null)

  useEffect(() => {
    // Connect socket
    const newSocket = io(SOCKET_URL, {
      auth: { token: token || '' },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = newSocket

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id)
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
      setConnected(false)
    })

    // Game events
    newSocket.on('game:state', (game) => {
      setCurrentGame(game)
      setCountdown(game?.timeLeft || 0)
    })

    newSocket.on('game:new_round', (game) => {
      setCurrentGame(game)
      setCountdown(game?.duration || 30)
      setLastResult(null)
    })

    newSocket.on('game:countdown', ({ timeLeft }) => {
      setCountdown(timeLeft)
    })

    newSocket.on('game:processing', () => {
      setCurrentGame(prev => prev ? { ...prev, status: 'processing' } : prev)
    })

    newSocket.on('game:result', (result) => {
      setLastResult(result)
      setCurrentGame(prev => prev
        ? { ...prev, status: 'completed', winningColor: result.winningColor }
        : prev
      )
      // Store recent rounds
      setRecentRounds(prev => [result, ...prev.slice(0, 9)])
    })

    newSocket.on('game:bet_placed', (data) => {
      setCurrentGame(prev => prev
        ? { ...prev, totalBetAmount: data.totalBetAmount, totalPlayers: data.totalPlayers, colorDistribution: data.colorDistribution }
        : prev
      )
    })

    // Wallet updates
    newSocket.on('wallet:updated', (walletData) => {
      updateWallet(walletData)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [token])

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      currentGame,
      countdown,
      lastResult,
      recentRounds,
    }}>
      {children}
    </SocketContext.Provider>
  )
}
