// ============================================================
// Dashboard Layout - Sidebar + Main Content
// ============================================================
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import WorldChat from '../components/WorldChat'
import { MessageSquare } from 'lucide-react'

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-dark-900 relative">
      {/* Background ambient light */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="bg-grid absolute inset-0 opacity-30" />
      </div>

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 relative z-10">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-glow hover:shadow-glow-lg transition-all scale-100 hover:scale-105 active:scale-95 z-40 animate-bounce-slow"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* World Chat Panel */}
      <WorldChat isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

export default DashboardLayout
