import { useEffect, useMemo, useState } from 'react'
import { login, api, keysToCamel } from './lib/api'

function StatCard({ title, value }) {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold text-gray-800">{value}</div>
    </div>
  )
}

function AuthView({ onLoggedIn }) {
  const [username, setUsername] = useState('superadmin')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const tok = await login(username, password)
      localStorage.setItem('token', tok.access_token)
      onLoggedIn()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm w-full bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Masuk</h2>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-gray-600">Username</label>
          <input value={username} onChange={(e)=>setUsername(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-gray-600">Password</label>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-2">
          {loading ? 'Memproses...' : 'Login'}
        </button>
      </form>
    </div>
  )
}

function FinanceModule() {
  const [summary, setSummary] = useState(null)
  const [tab, setTab] = useState('kas')
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0,10),
    type: 'penerimaan',
    account_code: '101',
    amount: '',
    description: ''
  })
  const [toast, setToast] = useState('')

  const loadSummary = async () => {
    const data = await api('/finance/summary')
    setSummary(data)
  }

  useEffect(() => { loadSummary() }, [])

  const submitCash = async (e) => {
    e.preventDefault()
    const payload = {
      date: form.date,
      type: form.type,
      account_code: form.account_code,
      amount: Number(form.amount),
      description: form.description || undefined
    }
    await api('/finance/cash', { method: 'POST', body: JSON.stringify(payload) })
    setToast('Tersimpan')
    setForm({ ...form, amount: '', description: '' })
    await loadSummary()
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <button className={`px-3 py-1 rounded ${tab==='kas'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setTab('kas')}>Kas</button>
        <button className={`px-3 py-1 rounded ${tab==='piutang'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setTab('piutang')}>Piutang</button>
        <button className={`px-3 py-1 rounded ${tab==='utang'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setTab('utang')}>Utang</button>
      </div>

      {tab==='kas' && (
        <form onSubmit={submitCash} className="grid sm:grid-cols-5 gap-3">
          <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="border rounded px-2 py-2" />
          <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})} className="border rounded px-2 py-2">
            <option value="penerimaan">Penerimaan</option>
            <option value="pengeluaran">Pengeluaran</option>
          </select>
          <input placeholder="Kode Akun" value={form.account_code} onChange={e=>setForm({...form, account_code:e.target.value})} className="border rounded px-2 py-2" />
          <input placeholder="Jumlah" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className="border rounded px-2 py-2" />
          <button className="bg-green-600 text-white rounded px-3">Simpan</button>
        </form>
      )}

      {summary && (
        <div className="mt-6 grid sm:grid-cols-3 gap-3">
          <StatCard title="Saldo Kas" value={summary.cash.toLocaleString('id-ID')} />
          <StatCard title="Piutang Baru" value={summary.receivables.baru.toLocaleString('id-ID')} />
          <StatCard title="Utang Baru" value={summary.payables.baru.toLocaleString('id-ID')} />
        </div>
      )}

      {toast && (
        <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{toast}</div>
      )}
    </div>
  )
}

function Dashboard() {
  const [me, setMe] = useState(null)
  const [overview, setOverview] = useState(null)
  const [health, setHealth] = useState(null)

  const load = async () => {
    try {
      const m = await api('/auth/me')
      setMe(m)
      const healthStatus = await api('/health')
      setHealth(healthStatus)
      if (m.role === 'SUPER_ADMIN') {
        const ov = await api('/dashboard/overview')
        setOverview(ov)
      }
    } catch (e) {
      console.error(e)
    }
  }
  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-3">
        <StatCard title="Status API" value={health?.database === 'ok' ? 'Online' : 'Degraded'} />
        <StatCard title="Role" value={me?.role || '-'} />
      </div>

      {overview && (
        <div className="grid sm:grid-cols-4 gap-3">
          <StatCard title="Divisi Aktif" value={overview.stats.divisions} />
          <StatCard title="User Aktif" value={overview.stats.users} />
          <StatCard title="Akun COA" value={overview.stats.accounts} />
          <StatCard title="Transaksi Kas" value={overview.stats.cash_tx} />
        </div>
      )}

      <FinanceModule />
    </div>
  )
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  useEffect(() => {
    if (!token) return
    // Optional: verify token by calling /auth/me
    api('/auth/me').catch(()=>{
      localStorage.removeItem('token');
      setToken(null)
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sistem Akuntansi PT PJP</h1>
          <div className="flex items-center gap-3">
            {token ? (
              <button onClick={()=>{localStorage.removeItem('token'); setToken(null)}} className="text-sm text-red-600">Logout</button>
            ) : null}
          </div>
        </header>

        {!token ? (
          <div className="flex items-center justify-center py-20">
            <AuthView onLoggedIn={()=>setToken(localStorage.getItem('token'))} />
          </div>
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  )
}

export default App
