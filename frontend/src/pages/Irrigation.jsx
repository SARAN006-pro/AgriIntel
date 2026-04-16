import { Droplets, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { getIrrigationAdvice, getIrrigationLogs } from '../services/api'

const CROP_OPTIONS = ['Rice', 'Wheat', 'Maize', 'Tomato', 'Potato', 'Onion', 'Soybean', 'Cotton', 'Sugarcane', 'Groundnut', 'Sunflower', 'Chilli', 'Turmeric', 'Coffee', 'Tea', 'Banana', 'Mango']

const URGENCY_CONFIG = {
  low: { icon: CheckCircle, color: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200/70 dark:border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300' },
  medium: { icon: Clock, color: 'amber', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200/70 dark:border-amber-500/20', text: 'text-amber-700 dark:text-amber-300' },
  high: { icon: AlertTriangle, color: 'rose', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200/70 dark:border-rose-500/20', text: 'text-rose-700 dark:text-rose-300' },
}

export default function Irrigation() {
  const [form, setForm] = useState({ soil_moisture: 50, crop: 'Rice', temperature: '', humidity: '' })
  const [advice, setAdvice] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [logLoading, setLogLoading] = useState(true)

  useEffect(() => { loadLogs() }, [])

  const loadLogs = async () => {
    setLogLoading(true)
    try {
      const resp = await getIrrigationLogs({ limit: 20 })
      setLogs(resp.data.logs || [])
    } catch { setLogs([]) }
    finally { setLogLoading(false) }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'crop' ? value : parseFloat(value) }))
  }

  const submit = async () => {
    setLoading(true)
    try {
      const payload = { soil_moisture: form.soil_moisture, crop: form.crop }
      if (form.temperature !== '') payload.temperature = form.temperature
      if (form.humidity !== '') payload.humidity = form.humidity
      const resp = await getIrrigationAdvice(payload)
      setAdvice(resp.data)
      loadLogs()
    } catch { setAdvice({ error: 'Failed to get irrigation advice' }) }
    finally { setLoading(false) }
  }

  const uc = advice?.urgency ? URGENCY_CONFIG[advice.urgency] : null
  const UrgencyIcon = uc?.icon

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar title="Irrigation Advisor" subtitle="Smart water management recommendations" />
      <div className="p-6 md:p-8 space-y-6">

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-5">Soil & Crop Inputs</h2>
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">Soil Moisture</label>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">{form.soil_moisture}%</span>
                </div>
                <input type="range" name="soil_moisture" value={form.soil_moisture} onChange={handleChange} min={0} max={100} step={1} className="w-full" />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>0% (dry)</span><span>100% (saturated)</span></div>
              </div>
              <div>
                <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Crop</label>
                <select name="crop" value={form.crop} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white">
                  {CROP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Temperature (°C)</label>
                  <input type="number" name="temperature" value={form.temperature} onChange={handleChange} placeholder="Optional" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Humidity (%)</label>
                  <input type="number" name="humidity" value={form.humidity} onChange={handleChange} placeholder="Optional" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                </div>
              </div>
              <button onClick={submit} disabled={loading} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-50 text-white font-semibold py-3 rounded-2xl transition-all shadow-sm">
                {loading ? 'Analysing...' : 'Get Irrigation Advice'}
              </button>
            </div>
          </div>

          {/* Advice Result */}
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-5">Recommendation</h2>
            {advice?.error ? (
              <div className="text-center py-12 text-rose-500">{advice.error}</div>
            ) : advice ? (
              <div className="space-y-4 fade-up">
                {uc && (
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${uc.bg} ${uc.border}`}>
                    <UrgencyIcon size={20} className={uc.text} />
                    <span className={`text-sm font-semibold capitalize ${uc.text}`}>{advice.urgency} urgency</span>
                  </div>
                )}
                <div className="bg-sky-50 dark:bg-sky-500/10 rounded-2xl px-4 py-3 border border-sky-200/70 dark:border-sky-500/20">
                  <p className="text-sm text-sky-800 dark:text-sky-200 leading-relaxed">{advice.recommendation}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-200/70 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Recommended Action</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{advice.action}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                  <span>Soil: {advice.soil_moisture}%</span>
                  <span>Crop: {advice.crop}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Droplets size={48} strokeWidth={1} className="mb-4 opacity-30" />
                <p className="text-sm">Enter soil data and click advice to see recommendations</p>
              </div>
            )}
          </div>
        </div>

        {/* Irrigation Log History */}
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Irrigation Log</h2>
          {logLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No irrigation logs yet. Submit an advice request to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-3 text-left">Date</th>
                    <th className="pb-3 text-left">Crop</th>
                    <th className="pb-3 text-right">Moisture</th>
                    <th className="pb-3 text-left">Urgency</th>
                    <th className="pb-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {logs.map(log => {
                    const logUc = URGENCY_CONFIG[log.urgency] || URGENCY_CONFIG.low
                    return (
                      <tr key={log.id}>
                        <td className="py-3 text-slate-400 text-xs">{new Date(log.created_at).toLocaleDateString()}</td>
                        <td className="py-3 font-medium text-slate-700 dark:text-slate-200 capitalize">{log.crop}</td>
                        <td className="py-3 text-right font-mono text-emerald-600 dark:text-emerald-300">{log.moisture_level}%</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border capitalize ${logUc.bg} ${logUc.border} ${logUc.text}`}>
                            {log.urgency}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-400 text-xs max-w-[200px] truncate">{log.recommended_action}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}