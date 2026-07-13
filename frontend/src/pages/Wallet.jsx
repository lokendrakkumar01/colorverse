// ============================================================
// Wallet Page - ColorVerse
// ============================================================
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  Wallet as WalletIcon, TrendingUp, TrendingDown, CreditCard,
  ArrowDownCircle, RefreshCw, CheckCircle, Clock, XCircle,
  Plus, Minus, ArrowRight
} from 'lucide-react'

const TABS = ['Overview', 'Deposit', 'Withdraw', 'History']

const Wallet = () => {
  const { wallet, refreshUser } = useAuth()
  const [tab, setTab] = useState('Overview')
  const [transactions, setTransactions] = useState([])
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [depositAmount, setDepositAmount] = useState(500)
  const [withdrawAmount, setWithdrawAmount] = useState(200)
  const [withdrawMethod, setWithdrawMethod] = useState('upi')
  const [upiId, setUpiId] = useState('')
  const [processing, setProcessing] = useState(false)
  const [depositType, setDepositType] = useState('upi')
  const [utrNumber, setUtrNumber] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [txRes, depRes, withRes] = await Promise.all([
        api.get('/wallet/transactions?limit=20'),
        api.get('/deposits/history?limit=20'),
        api.get('/withdrawals/history?limit=20'),
      ])
      setTransactions(txRes.transactions || [])
      setDeposits(depRes.deposits || [])
      setWithdrawals(withRes.withdrawals || [])
    } catch {}
    finally { setLoading(false) }
  }

  // Razorpay deposit
  const handleDeposit = async () => {
    if (depositAmount < 100) return toast.error('Minimum deposit is ₹100')
    try {
      setProcessing(true)
      const orderData = await api.post('/deposits/create-order', { amount: depositAmount })

      // Load Razorpay script
      if (!window.Razorpay) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        document.body.appendChild(script)
        await new Promise(resolve => { script.onload = resolve })
      }

      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'ColorVerse',
        description: 'Add Money to Wallet',
        order_id: orderData.order.id,
        handler: async (response) => {
          try {
            await api.post('/deposits/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              depositId: orderData.depositId,
            })
            toast.success(`₹${depositAmount} added to wallet!`)
            refreshUser()
            fetchAll()
            setTab('Overview')
          } catch (err) {
            toast.error('Payment verification failed')
          }
        },
        prefill: { email: 'user@example.com' },
        theme: { color: '#7c3aed' },
        modal: { ondismiss: () => toast.error('Payment cancelled') },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      toast.error(err.message || 'Failed to create order')
    } finally {
      setProcessing(false)
    }
  }

  // UPI Manual deposit
  const handleUpiDeposit = async () => {
    if (depositAmount < 100) return toast.error('Minimum deposit is ₹100')
    if (!utrNumber || utrNumber.trim().length < 6) {
      return toast.error('Please enter a valid Transaction UTR / Reference number')
    }
    try {
      setProcessing(true)
      await api.post('/deposits/upi-deposit', {
        amount: depositAmount,
        utrNumber: utrNumber.trim(),
      })
      toast.success('Deposit request submitted successfully! Admin will verify soon.')
      setUtrNumber('')
      refreshUser()
      fetchAll()
      setTab('Overview')
    } catch (err) {
      toast.error(err.message || 'Failed to submit deposit request')
    } finally {
      setProcessing(false)
    }
  }

  // Withdrawal request
  const handleWithdraw = async () => {
    if (withdrawAmount < 200) return toast.error('Minimum withdrawal is ₹200')
    if (withdrawAmount > (wallet?.balance || 0)) return toast.error('Insufficient balance')
    if (withdrawMethod === 'upi' && !upiId) return toast.error('Please enter UPI ID')

    try {
      setProcessing(true)
      await api.post('/withdrawals/request', {
        amount: withdrawAmount,
        withdrawalMethod: withdrawMethod,
        upiId: upiId,
      })
      toast.success('Withdrawal request submitted! Processing within 24-48 hours.')
      refreshUser()
      fetchAll()
      setTab('Overview')
    } catch (err) {
      toast.error(err.message || 'Withdrawal failed')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      completed: 'badge-success',
      approved: 'badge-success',
      pending: 'badge-warning',
      rejected: 'badge-error',
      failed: 'badge-error',
      cancelled: 'badge-info',
    }
    return map[status] || 'badge-info'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
        <WalletIcon className="w-6 h-6 text-brand-400" />
        Wallet
      </h1>

      {/* Wallet Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Available Balance', value: `₹${wallet?.balance?.toFixed(2) || '0.00'}`, icon: WalletIcon, color: 'text-brand-400', bg: 'bg-brand-600/20' },
          { label: 'Total Deposited', value: `₹${wallet?.totalDeposited?.toFixed(0) || '0'}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-600/20' },
          { label: 'Total Withdrawn', value: `₹${wallet?.totalWithdrawn?.toFixed(0) || '0'}`, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-600/20' },
          { label: 'Referral Earnings', value: `₹${wallet?.referralEarnings?.toFixed(0) || '0'}`, icon: ArrowRight, color: 'text-amber-400', bg: 'bg-amber-600/20' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 space-y-3">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-slate-400 text-xs">{s.label}</p>
              <p className={`text-xl font-black font-mono ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-700/60 p-1 rounded-xl border border-dark-300/30 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === t ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-white">Recent Transactions</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Balance After</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx._id}>
                      <td>
                        <span className="badge badge-brand capitalize text-xs">
                          {tx.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate text-slate-300">{tx.description}</td>
                      <td className={`font-mono font-bold ${
                        ['game_win', 'deposit', 'referral_bonus', 'bonus_credit', 'admin_credit'].includes(tx.type)
                          ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {['game_win', 'deposit', 'referral_bonus', 'bonus_credit', 'admin_credit'].includes(tx.type) ? '+' : '-'}₹{tx.amount}
                      </td>
                      <td className="font-mono text-slate-300">₹{tx.balanceAfter?.toFixed(2)}</td>
                      <td className="text-slate-400 text-xs">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td><span className={`badge ${getStatusBadge(tx.status)}`}>{tx.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">No transactions yet</p>
          )}
        </div>
      )}

      {tab === 'Deposit' && (
        <div className="max-w-md glass-card p-6 space-y-5">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-400" />
            Add Money to Wallet
          </h2>

          {/* Deposit Method Selector */}
          <div className="flex gap-2 p-1 bg-dark-700/60 rounded-xl border border-dark-300/30">
            <button
              type="button"
              onClick={() => setDepositType('upi')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                depositType === 'upi' ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              UPI / QR Code
            </button>
            <button
              type="button"
              onClick={() => setDepositType('razorpay')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                depositType === 'razorpay' ? 'bg-brand-600 text-white shadow-glow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Razorpay (Auto)
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">Amount (₹)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="input-field text-xl font-black font-mono"
                min={100}
                max={100000}
              />
              <p className="text-slate-500 text-xs mt-1">Minimum: ₹100 | Maximum: ₹1,00,000</p>
            </div>
            {/* Quick amounts */}
            <div className="flex flex-wrap gap-2">
              {[100, 500, 1000, 2000, 5000, 10000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(amt)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${depositAmount === amt ? 'bg-brand-600 text-white' : 'bg-dark-400 text-slate-300 hover:bg-dark-300'}`}
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>

            {/* UPI QR Manual Method */}
            {depositType === 'upi' && (
              <div className="space-y-4 pt-2 border-t border-dark-300/30">
                <div className="bg-dark-700/60 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3">
                  <p className="text-white text-xs font-semibold text-center uppercase tracking-wider text-brand-400">
                    Scan with GPay, PhonePe, Paytm, BHIM
                  </p>
                  
                  {/* Dynamic QR Code */}
                  <div className="w-[180px] h-[180px] bg-white p-2 rounded-xl flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=9568804305@ybl%26pn=ColorVerse%26am=${depositAmount}%26cu=INR`} 
                      alt="UPI QR Code" 
                      className="w-full h-full"
                    />
                  </div>

                  <div className="w-full text-center space-y-1">
                    <p className="text-slate-400 text-xs">UPI ID:</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-white font-mono font-bold text-sm bg-dark-400 px-2.5 py-1 rounded-lg">
                        9568804305@ybl
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('9568804305@ybl')
                          toast.success('UPI ID copied!')
                        }}
                        className="text-xs text-brand-400 hover:text-brand-300 underline font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* UTR Input */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 text-sm font-semibold">
                    UTR / Transaction Ref Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 12-digit UTR/Ref Number"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="input-field font-mono text-center tracking-wider text-lg"
                    required
                  />
                  <p className="text-slate-500 text-xs">
                    Please submit the exact 12-digit transaction ID / UTR shown in your UPI app.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleUpiDeposit}
                  disabled={processing}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 shadow-glow"
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Submit Deposit Request (₹{depositAmount.toLocaleString()})</>
                  )}
                </button>
              </div>
            )}

            {/* Razorpay Method */}
            {depositType === 'razorpay' && (
              <div className="space-y-4 pt-2 border-t border-dark-300/30">
                <button
                  type="button"
                  onClick={handleDeposit}
                  disabled={processing}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 shadow-glow"
                >
                  {processing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Pay ₹{depositAmount.toLocaleString()} via Razorpay
                    </>
                  )}
                </button>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-400 text-center">
                  🔒 Secure payment powered by Razorpay. Supports UPI, Cards, Net Banking & Wallets.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Withdraw' && (
        <div className="max-w-md glass-card p-6 space-y-5">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-brand-400" />
            Withdraw Funds
          </h2>
          <p className="text-slate-400 text-sm">
            Available: <span className="text-white font-bold">₹{wallet?.balance?.toFixed(2)}</span>
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">Amount (₹)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="input-field text-xl font-black font-mono"
                min={200}
                max={50000}
              />
              <p className="text-slate-500 text-xs mt-1">Minimum: ₹200 | Maximum: ₹50,000</p>
            </div>
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">Withdrawal Method</label>
              <select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                className="input-field"
              >
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            {withdrawMethod === 'upi' && (
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-2">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="input-field"
                />
              </div>
            )}
            <button
              onClick={handleWithdraw}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Minus className="w-4 h-4" />}
              Request Withdrawal ₹{withdrawAmount.toLocaleString()}
            </button>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-400">
            ⏳ Withdrawal requests are processed within 24-48 business hours after admin approval.
          </div>
        </div>
      )}

      {tab === 'History' && (
        <div className="space-y-6">
          {/* Deposits */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="font-semibold text-white">Deposit History</h2>
            {deposits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map(d => (
                      <tr key={d._id}>
                        <td className="text-white font-bold font-mono">₹{d.amount}</td>
                        <td className="capitalize text-slate-300">{d.paymentMethod}</td>
                        <td className="text-slate-400 text-xs font-mono">
                          {d.utrNumber ? `UTR: ${d.utrNumber}` : (d.razorpayPaymentId || d._id.slice(-8))}
                        </td>
                        <td><span className={`badge ${getStatusBadge(d.status)}`}>{d.status}</span></td>
                        <td className="text-slate-400 text-xs">
                          {new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-slate-400 text-center py-6">No deposits yet</p>}
          </div>

          {/* Withdrawals */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="font-semibold text-white">Withdrawal History</h2>
            {withdrawals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>UPI/Account</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map(w => (
                      <tr key={w._id}>
                        <td className="text-white font-bold font-mono">₹{w.amount}</td>
                        <td className="capitalize text-slate-300">{w.withdrawalMethod}</td>
                        <td className="text-slate-400 text-xs">{w.upiId || 'Bank Transfer'}</td>
                        <td><span className={`badge ${getStatusBadge(w.status)}`}>{w.status}</span></td>
                        <td className="text-slate-400 text-xs">
                          {new Date(w.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-slate-400 text-center py-6">No withdrawals yet</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default Wallet
