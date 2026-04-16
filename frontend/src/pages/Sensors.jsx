import { Radio, Wifi, Copy, CheckCircle, AlertTriangle, Droplets, Thermometer, CloudRain, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { getSensorReadings, getWebhookUrl, sendSensorData } from '../services/api'

const SENSOR_TYPES = ['soil_moisture', 'temperature', 'humidity', 'rainfall', 'soil_ph']
const SENSOR_ICONS = {
  soil_moisture: Droplets,
  temperature: Thermometer,
  humidity: CloudRain,
  rainfall: CloudRain,
  soil_ph: Activity,
}
const SENSOR_LABELS = {
  soil_moisture: 'Soil Moisture',
  temperature: 'Temperature',
  humidity: 'Humidity',
  rainfall: 'Rainfall',
  soil_ph: 'Soil pH',
}
const SENSOR_UNITS = {
  soil_moisture: '%',
  temperature: '°C',
  humidity: '%',
  rainfall: 'mm',
  soil_ph: 'pH',
}

const THRESHOLDS = {
  soil_moisture: { min: 30, max: 80 },
  temperature: { min: 10, max: 40 },
  humidity: { min: 40, max: 85 },
  rainfall: { min: 0, max: 200 },
  soil_ph: { min: 5.5, max: 8.0 },
}

function isOutOfRange(type, value) {
  const t = THRESHOLDS[type]
  if (!t) return null
  if (value < t.min) return 'low'
  if (value > t.max) return 'high'
  return null
}

export default function Sensors() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [form, setForm] = useState({ sensor_type: 'soil_moisture', value: '', unit: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')

  useEffect(() => { loadAll() }, [filterType])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [rResp, wResp] = await Promise.all([
        getSensorReadings(filterType ? { sensor_type: filterType } : {}),
        getWebhookUrl(),
      ])
      setReadings(rResp.data.readings || [])
      setWebhookUrl(wResp.data.webhook_url || '')
    } catch { setReadings([]) }
    finally { setLoading(false) }
  }

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.value) return
    setSubmitting(true)
    setSubmitMsg('')
    try {
      const unit = form.unit || SENSOR_UNITS[form.sensor_type] || ''
      await sendSensorData({ sensor_type: form.sensor_type, value: parseFloat(form.value), unit })
      setSubmitMsg('Sensor data submitted successfully!')
      setForm(f => ({ ...f, value: '', unit: '' }))
      loadAll()
    } catch {
      setSubmitMsg('Failed to submit sensor data.')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar title="IoT Sensors" subtitle="Real-time sensor data and webhook configuration" />
      <div className="p-6 md:p-8 space-y-6">

        {/* Webhook URL */}
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Radio size={16} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Webhook Endpoint</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Send sensor data from your IoT devices to this endpoint via HTTP POST. Configure your sensor to POST JSON payload to this URL.</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-emerald-600 dark:text-emerald-300 break-all">{webhookUrl || 'https://your-backend-url/api/sensors/data'}</code>
            <button onClick={copyWebhook} className="shrink-0 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm">
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <div className="mt-3 bg-sky-50 dark:bg-sky-500/10 border border-sky-200/70 dark:border-sky-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-sky-700 dark:text-sky-300 font-medium">Payload format (JSON)</p>
            <p className="text-xs text-sky-600 dark:text-sky-400 font-mono mt-1">{`{"sensor_type": "soil_moisture", "value": 45.5, "unit": "%", "farm_id": 1}`}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Manual Submission Form */}
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Manual Sensor Entry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Sensor Type</label>
                <select value={form.sensor_type} onChange={e => setForm(f => ({ ...f, sensor_type: e.target.value, unit: '' }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white">
                  {SENSOR_TYPES.map(t => <option key={t} value={t}>{SENSOR_LABELS[t] || t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Value</label>
                <div className="flex gap-2">
                  <input type="number" step="any" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="e.g. 45.5" className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                  <span className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm text-slate-500 dark:text-slate-400">{SENSOR_UNITS[form.sensor_type]}</span>
                </div>
              </div>
              {form.value && isOutOfRange(form.sensor_type, parseFloat(form.value)) && (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-300 text-sm">
                  <AlertTriangle size={16} />
                  Value is outside normal range ({THRESHOLDS[form.sensor_type].min}–{THRESHOLDS[form.sensor_type].max})
                </div>
              )}
              {submitMsg && <div className={`px-4 py-3 rounded-xl text-sm border ${submitMsg.includes('success') ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/70 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200/70 dark:border-rose-500/20 text-rose-700 dark:text-rose-300'}`}>{submitMsg}</div>}
              <button type="submit" disabled={submitting || !form.value} className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-50 text-white font-semibold py-3 rounded-2xl transition-all shadow-sm">
                {submitting ? 'Submitting...' : 'Submit Reading'}
              </button>
            </form>
          </div>

          {/* Current Readings Summary */}
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Latest Readings</h2>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
            ) : readings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">No sensor readings yet. Submit data from your IoT device.</p>
            ) : (
              <div className="space-y-3">
                {readings.slice(0, 8).map(r => {
                  const range = isOutOfRange(r.sensor_type, r.value)
                  const Icon = SENSOR_ICONS[r.sensor_type] || Activity
                  return (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${range === 'high' || range === 'low' ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                        <Icon size={16} className={range === 'high' || range === 'low' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400">{SENSOR_LABELS[r.sensor_type] || r.sensor_type}</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{r.value} <span className="text-xs font-normal text-slate-400">{r.unit}</span></p>
                      </div>
                      {range && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-500/20 capitalize">
                          <AlertTriangle size={10} /> {range}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">{new Date(r.timestamp).toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* All Readings Table */}
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">All Readings</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter:</span>
              <select value={filterType} onChange={e => { setFilterType(e.target.value); loadAll() }} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white text-xs">
                <option value="">All types</option>
                {SENSOR_TYPES.map(t => <option key={t} value={t}>{SENSOR_LABELS[t] || t}</option>)}
              </select>
              <button onClick={loadAll} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">Refresh</button>
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
          ) : readings.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No readings found for this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-3 text-left">Timestamp</th>
                    <th className="pb-3 text-left">Type</th>
                    <th className="pb-3 text-right">Value</th>
                    <th className="pb-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {readings.map(r => {
                    const range = isOutOfRange(r.sensor_type, r.value)
                    return (
                      <tr key={r.id}>
                        <td className="py-3 text-slate-400 text-xs">{new Date(r.timestamp).toLocaleString()}</td>
                        <td className="py-3 font-medium text-slate-700 dark:text-slate-200 capitalize">{SENSOR_LABELS[r.sensor_type] || r.sensor_type}</td>
                        <td className="py-3 text-right font-mono text-slate-900 dark:text-white">{r.value} <span className="text-xs text-slate-400">{r.unit}</span></td>
                        <td className="py-3">
                          {range ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/70 dark:border-rose-500/20 capitalize">
                              <AlertTriangle size={10} /> Out of range
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-500/20">
                              <CheckCircle size={10} /> Normal
                            </span>
                          )}
                        </td>
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