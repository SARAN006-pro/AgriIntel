import { FolderOpen, Plus, Pencil, Trash2, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import EmptyState from '../components/EmptyState'
import TopBar from '../components/TopBar'
import { createYieldRecord, deleteYieldRecord, getYieldRecords, updateYieldRecord } from '../services/api'

const CROP_OPTIONS = ['Rice', 'Wheat', 'Maize', 'Tomato', 'Potato', 'Onion', 'Soybean', 'Cotton', 'Sugarcane', 'Groundnut', 'Sunflower', 'Chilli', 'Turmeric', 'Coffee', 'Tea', 'Banana', 'Mango']

const EMPTY_FORM = { crop: '', year: new Date().getFullYear(), yield_kg_per_ha: '', area_ha: '', notes: '' }

export default function Records() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => { loadRecords() }, [])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const resp = await getYieldRecords()
      setRecords(resp.data.records || [])
    } catch { setRecords([]) }
    finally { setLoading(false) }
  }

  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const openEdit = (r) => {
    setForm({ crop: r.crop, year: r.year, yield_kg_per_ha: r.yield_kg_per_ha, area_ha: r.area_ha || '', notes: r.notes || '' })
    setEditingId(r.id)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'crop' ? value : name === 'year' ? parseInt(value) : value }))
  }

  const handleSave = async () => {
    if (!form.crop || !form.year || !form.yield_kg_per_ha) { setError('Crop, year, and yield are required'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        crop: form.crop,
        year: form.year,
        yield_kg_per_ha: parseFloat(form.yield_kg_per_ha),
        area_ha: form.area_ha ? parseFloat(form.area_ha) : undefined,
        notes: form.notes || undefined,
      }
      if (editingId) {
        await updateYieldRecord(editingId, payload)
        setSuccess('Record updated!')
      } else {
        await createYieldRecord(payload)
        setSuccess('Record added!')
      }
      setShowForm(false)
      loadRecords()
    } catch (err) {
      setError(err.response?.data?.detail || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this yield record?')) return
    try { await deleteYieldRecord(id); loadRecords() } catch { setError('Delete failed') }
  }

  // Chart data: yield trend by year
  const chartData = [...records]
    .sort((a, b) => a.year - b.year)
    .reduce((acc, r) => {
      const existing = acc.find(d => d.year === r.year)
      if (existing) {
        existing.yield += parseFloat(r.yield_kg_per_ha)
        existing.count += 1
      } else {
        acc.push({ year: r.year, yield: parseFloat(r.yield_kg_per_ha), count: 1 })
      }
      return acc
    }, [])
    .map(d => ({ ...d, avgYield: Math.round(d.yield / d.count) }))

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar title="Yield Records" subtitle="Track and analyse harvest data over time" />
      <div className="p-6 md:p-8 space-y-6">

        {error && <div className="px-4 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded-2xl text-sm border border-rose-200/70">{error}</div>}
        {success && <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm border border-emerald-200/70">{success}</div>}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Harvest History</h2>
            <p className="text-xs text-slate-400 mt-0.5">{records.length} records</p>
          </div>
          <button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2">
            <Plus size={14} /> Add Record
          </button>
        </div>

        {showForm && (
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">{editingId ? 'Edit Record' : 'New Yield Record'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Crop *</label>
                <select name="crop" value={form.crop} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white capitalize">
                  <option value="">Select crop</option>
                  {CROP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Year *</label>
                <input type="number" name="year" value={form.year} onChange={handleChange} min={2000} max={2100} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
              </div>
              <div>
                <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Yield (kg/ha) *</label>
                <input type="number" name="yield_kg_per_ha" value={form.yield_kg_per_ha} onChange={handleChange} placeholder="5000" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
              </div>
              <div>
                <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Area (ha)</label>
                <input type="number" name="area_ha" value={form.area_ha} onChange={handleChange} placeholder="5.0" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Notes</label>
                <input type="text" name="notes" value={form.notes} onChange={handleChange} placeholder="Weather conditions, soil amendments, etc." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-2xl text-sm transition-all">{saving ? 'Saving...' : 'Save Record'}</button>
              <button onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium py-2.5 px-6 rounded-2xl text-sm transition-all hover:bg-slate-200 dark:hover:bg-slate-700">Cancel</button>
            </div>
          </div>
        )}

        {/* Trend Chart */}
        {chartData.length > 1 && (
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-semibold text-slate-900 dark:text-white">Yield Trend Over Time</h2>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} />
                  <Tooltip formatter={(v) => [`${v} kg/ha`, 'Avg Yield']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Line type="monotone" dataKey="avgYield" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Records Table */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
        ) : records.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No yield records yet" description="Track your harvest history by adding the first record." action={<button onClick={openNew} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium">+ Add Record</button>} />
        ) : (
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="py-3 px-4 text-left">Crop</th>
                  <th className="py-3 px-4 text-right">Year</th>
                  <th className="py-3 px-4 text-right">Yield (kg/ha)</th>
                  <th className="py-3 px-4 text-right">Area (ha)</th>
                  <th className="py-3 px-4 text-left">Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white capitalize">{r.crop}</td>
                    <td className="py-3 px-4 text-right text-slate-500">{r.year}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-300">{parseFloat(r.yield_kg_per_ha).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-slate-500">{r.area_ha ? parseFloat(r.area_ha).toLocaleString() : '—'}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs max-w-[180px] truncate">{r.notes || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}