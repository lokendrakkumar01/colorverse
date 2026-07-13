// Admin Withdrawals Management
import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowDownCircle, CheckCircle, XCircle } from 'lucide-react'

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { fetchWithdrawals() }, [status, page])

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/admin/withdrawals?status=${status}&page=${page}&limit=15`)
      setWithdrawals(data.withdrawals || [])
      setTotal(data.pagination?.total || 0)
    } catch {}
    finally { setLoading(false) }
  }

  const handleApprove = async (id) => {
    const ref = window.prompt('Transaction reference (UTR/TxID):') || ''
    try {
      await api.patch(`/admin/withdrawals/${id}/approve`, { transactionReference: ref })
      toast.success('Withdrawal approved!')
      fetchWithdrawals()
    } catch (err) { toast.error(err.message) }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:')
    if (!reason) return
    try {
      await api.patch(`/admin/withdrawals/${id}/reject`, { reason })
      toast.success('Withdrawal rejected & amount refunded!')
      fetchWithdrawals()
    } catch (err) { toast.error(err.message) }
  }

  const statusColors = { completed: 'badge-success', pending: 'badge-warning', rejected: 'badge-error', cancelled: 'badge-info', approved: 'badge-success' }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
        <ArrowDownCircle className="w-6 h-6 text-red-400" /> Withdrawal Management
      </h1>

      <div className="flex gap-1 bg-dark-700/60 p-1 rounded-xl border border-dark-300/30 w-fit">
        {['pending', 'completed', 'rejected', 'all'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
              ${status === s ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Method</th>
                <th>UPI/Account</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : withdrawals.map(w => (
                <tr key={w._id}>
                  <td>
                    <p className="text-white font-medium">{w.user?.username}</p>
                    <p className="text-slate-500 text-xs">{w.user?.email}</p>
                  </td>
                  <td className="font-mono font-bold text-amber-400">₹{w.amount}</td>
                  <td className="capitalize text-slate-300">{w.withdrawalMethod}</td>
                  <td className="text-slate-400 text-xs">{w.upiId || 'Bank Transfer'}</td>
                  <td><span className={`badge ${statusColors[w.status]}`}>{w.status}</span></td>
                  <td className="text-slate-400 text-xs">
                    {new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    {w.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(w._id)}
                          className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-2 py-1 rounded-lg text-xs transition">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => handleReject(w._id)}
                          className="flex items-center gap-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2 py-1 rounded-lg text-xs transition">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                    {w.status !== 'pending' && w.transactionReference && (
                      <p className="text-slate-400 text-xs font-mono">{w.transactionReference}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-slate-400 text-sm">Total: {total}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Prev</button>
          <button onClick={() => setPage(p => p+1)} disabled={withdrawals.length < 15} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  )
}

export default AdminWithdrawals
