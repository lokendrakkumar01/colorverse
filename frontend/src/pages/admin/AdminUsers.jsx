// Admin Users Management
import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Users, Search, Ban, CheckCircle, CreditCard } from 'lucide-react'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [creditModal, setCreditModal] = useState(null)
  const [creditAmount, setCreditAmount] = useState(100)
  const [creditNote, setCreditNote] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [search, page])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/admin/users?search=${search}&page=${page}&limit=15`)
      setUsers(data.users || [])
      setTotal(data.pagination?.total || 0)
    } catch {}
    finally { setLoading(false) }
  }

  const handleBan = async (userId) => {
    try {
      const reason = window.prompt('Ban reason (leave empty to unban):')
      if (reason === null) return
      await api.patch(`/admin/users/${userId}/ban`, { reason })
      toast.success('User status updated')
      fetchUsers()
    } catch (err) { toast.error(err.message) }
  }

  const handleCredit = async () => {
    try {
      await api.post(`/admin/users/${creditModal}/credit`, { amount: creditAmount, note: creditNote })
      toast.success(`₹${creditAmount} credited!`)
      setCreditModal(null); setCreditAmount(100); setCreditNote('')
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-red-400" /> User Management
          <span className="text-slate-400 text-base font-normal ml-1">({total})</span>
        </h1>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="input-field pl-10"
        />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Balance</th>
                <th>Games</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-blue-300 text-xs font-bold">
                        {u.username?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{u.username}</span>
                      {u.role === 'admin' && <span className="badge badge-error text-xs">ADMIN</span>}
                    </div>
                  </td>
                  <td className="text-slate-400 text-xs">{u.email}</td>
                  <td className="font-mono text-emerald-400">₹{u.wallet?.balance?.toFixed(0) || 0}</td>
                  <td>{u.totalGames || 0}</td>
                  <td>
                    <span className={`badge ${u.isBanned ? 'badge-error' : !u.isEmailVerified ? 'badge-warning' : 'badge-success'}`}>
                      {u.isBanned ? 'Banned' : !u.isEmailVerified ? 'Unverified' : 'Active'}
                    </span>
                  </td>
                  <td className="text-slate-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleBan(u._id)} disabled={u.role === 'admin'}
                        className={`p-1.5 rounded-lg text-xs transition ${u.isBanned ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'} disabled:opacity-40`}>
                        {u.isBanned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setCreditModal(u._id)}
                        className="p-1.5 rounded-lg bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 transition">
                        <CreditCard className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <p className="text-slate-400 text-sm">Showing {users.length} of {total}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
          <button onClick={() => setPage(p => p+1)} disabled={users.length < 15} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
        </div>
      </div>

      {/* Credit Modal */}
      {creditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-sm space-y-4">
            <h3 className="text-white font-semibold">Credit Wallet</h3>
            <input type="number" value={creditAmount} onChange={e => setCreditAmount(Number(e.target.value))} className="input-field" placeholder="Amount" min={1} />
            <input type="text" value={creditNote} onChange={e => setCreditNote(e.target.value)} className="input-field" placeholder="Note (optional)" />
            <div className="flex gap-3">
              <button onClick={handleCredit} className="btn-success flex-1">Credit ₹{creditAmount}</button>
              <button onClick={() => setCreditModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
