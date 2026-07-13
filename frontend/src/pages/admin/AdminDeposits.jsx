// Admin Deposits Management
import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { CreditCard, CheckCircle } from 'lucide-react'

const AdminDeposits = () => {
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => { fetchDeposits() }, [status, page])

  const fetchDeposits = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/admin/deposits?status=${status}&page=${page}&limit=15`)
      setDeposits(data.deposits || [])
      setTotal(data.pagination?.total || 0)
    } catch {}
    finally { setLoading(false) }
  }

  const handleApprove = async (id) => {
    const note = window.prompt('Admin note (optional):') || ''
    try {
      await api.patch(`/admin/deposits/${id}/approve`, { note })
      toast.success('Deposit approved & wallet credited!')
      fetchDeposits()
    } catch (err) { toast.error(err.message) }
  }

  const statusColors = { completed: 'badge-success', pending: 'badge-warning', failed: 'badge-error', cancelled: 'badge-info' }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
        <CreditCard className="w-6 h-6 text-red-400" /> Deposit Management
      </h1>

      {/* Status Filter */}
      <div className="flex gap-1 bg-dark-700/60 p-1 rounded-xl border border-dark-300/30 w-fit">
        {['all', 'pending', 'completed', 'failed'].map(s => (
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
                <th>Reference</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">Loading...</td></tr>
              ) : deposits.map(d => (
                <tr key={d._id}>
                  <td>
                    <p className="text-white font-medium">{d.user?.username}</p>
                    <p className="text-slate-500 text-xs">{d.user?.email}</p>
                  </td>
                  <td className="font-mono font-bold text-white">₹{d.amount}</td>
                  <td className="capitalize text-slate-300">{d.paymentMethod}</td>
                  <td className="text-slate-400 text-xs font-mono">
                    {d.utrNumber ? (
                      <span className="text-brand-400 font-bold">UTR: {d.utrNumber}</span>
                    ) : (
                      d.razorpayPaymentId || d._id.slice(-8)
                    )}
                  </td>
                  <td><span className={`badge ${statusColors[d.status]}`}>{d.status}</span></td>
                  <td className="text-slate-400 text-xs">
                    {new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    {d.status === 'pending' && (
                      <button onClick={() => handleApprove(d._id)}
                        className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition">
                        <CheckCircle className="w-3 h-3" /> Approve
                      </button>
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
          <button onClick={() => setPage(p => p+1)} disabled={deposits.length < 15} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  )
}

export default AdminDeposits
