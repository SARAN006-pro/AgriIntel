import { DollarSign, TrendingUp, TrendingDown, Calculator } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import TopBar from '../components/TopBar'
import { getProfitMargin, getMarketPrices, getCropsList } from '../services/api'

const INITIAL_FORM = {
  crop: 'rice',
  area_ha: 5,
  fertilizer_cost: 10000,
  pesticide_cost: 3000,
  labor_cost: 8000,
  expected_yield_kg: 5000,
  price_per_kg: 25,
}

export default function Economics() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [crops, setCrops] = useState([])
  const [priceHint, setPriceHint] = useState('')

  useEffect(() => { loadCrops() }, [])

  const loadCrops = async () => {
    try {
      const resp = await getCropsList()
      setCrops(resp.data.crops || [])
    } catch { setCrops([]) }
  }

  const loadMarketPrice = async (cropName) => {
    if (!cropName) return
    try {
      const resp = await getMarketPrices()
      const prices = resp.data.prices || []
      const avg = prices.filter(p => p.crop.toLowerCase() === cropName.toLowerCase())
      if (avg.length > 0) {
        const avgp = (avg.reduce((s, p) => s + p.price_per_kg, 0) / avg.length).toFixed(2)
        setPriceHint(`Market avg: ₹${avgp}/kg`)
      } else {
        setPriceHint('')
      }
    } catch { setPriceHint('') }
  }

  const handleCropChange = (e) => {
    const val = e.target.value
    setForm(f => ({ ...f, crop: val }))
    loadMarketPrice(val)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: parseFloat(value) }))
  }

  const submit = async () => {
    setLoading(true)
    try {
      const resp = await getProfitMargin(form)
      setResult(resp.data)
    } catch { setResult({ error: 'Calculation failed' }) }
    finally { setLoading(false) }
  }

  const costData = result ? [
    { name: 'Fertilizer', value: result.breakdown.fertilizer_cost },
    { name: 'Pesticide', value: result.breakdown.pesticide_cost },
    { name: 'Labor', value: result.breakdown.labor_cost },
  ] : []

  const isProfitable = result && result.profit_margin > 0

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <TopBar title="Profit Margin Calculator" subtitle="Estimate revenue and costs for your crop" />
      <div className="p-6 md:p-8 space-y-6">

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-5">Cost & Revenue Inputs</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Crop</label>
                  <select name="crop" value={form.crop} onChange={handleCropChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white capitalize">
                    {crops.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {priceHint && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{priceHint}</p>}
                </div>
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Area (hectares)</label>
                  <input type="number" name="area_ha" value={form.area_ha} onChange={handleChange} min={0.1} step={0.1} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Fertilizer Cost (₹)</label>
                  <input type="number" name="fertilizer_cost" value={form.fertilizer_cost} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Pesticide Cost (₹)</label>
                  <input type="number" name="pesticide_cost" value={form.pesticide_cost} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Labor Cost (₹)</label>
                  <input type="number" name="labor_cost" value={form.labor_cost} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Price per kg (₹)</label>
                  <input type="number" name="price_per_kg" value={form.price_per_kg} onChange={handleChange} step={0.5} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-1 block">Expected Yield (kg)</label>
                <input type="number" name="expected_yield_kg" value={form.expected_yield_kg} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
              </div>
              <button onClick={submit} disabled={loading} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-50 text-white font-semibold py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2">
                <Calculator size={16} /> {loading ? 'Calculating...' : 'Calculate Profit'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-5">Results</h2>
            {result?.error ? (
              <div className="text-center py-12 text-rose-500">{result.error}</div>
            ) : result ? (
              <div className="space-y-5 fade-up">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-200/70 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Cost</p>
                    <p className="font-bold text-slate-900 dark:text-white text-lg">₹{result.total_cost.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-200/70 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Revenue</p>
                    <p className="font-bold text-sky-600 dark:text-sky-300 text-lg">₹{result.total_revenue.toLocaleString()}</p>
                  </div>
                  <div className={`rounded-2xl px-4 py-3 border text-center ${isProfitable ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/70 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200/70 dark:border-rose-500/20'}`}>
                    <p className={`text-xs mb-1 ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>Profit Margin</p>
                    <p className={`font-bold text-lg ${isProfitable ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                      ₹{result.profit_margin.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Profit margin % */}
                <div className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl ${isProfitable ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}`}>
                  {isProfitable ? <TrendingUp size={24} className="text-emerald-600 dark:text-emerald-400" /> : <TrendingDown size={24} className="text-rose-600 dark:text-rose-400" />}
                  <div className="text-center">
                    <p className={`text-3xl font-bold ${isProfitable ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>{result.profit_margin_pct}%</p>
                    <p className={`text-xs ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>Profit Margin</p>
                  </div>
                </div>

                {/* Cost breakdown chart */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Cost Breakdown</p>
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costData} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Cost']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {costData.map((_, i) => <Cell key={i} fill={['#3b82f6', '#22c55e', '#f59e0b'][i]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 justify-center mt-2">
                    {costData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="w-3 h-3 rounded-full" style={{ background: ['#3b82f6', '#22c55e', '#f59e0b'][i] }} />
                        {d.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost vs Revenue donut */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Cost vs Revenue</p>
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: 'Total Cost', value: result.total_cost },
                          { name: 'Profit', value: Math.max(0, result.profit_margin) },
                        ]} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value"
                          labels={['Cost', 'Profit']}
                        >
                          <Cell fill="#94a3b8" />
                          <Cell fill={isProfitable ? '#22c55e' : '#f59e0b'} />
                        </Pie>
                        <Tooltip formatter={(v, n) => [`₹${v.toLocaleString()}`, n]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <DollarSign size={48} strokeWidth={1} className="mb-4 opacity-30" />
                <p className="text-sm">Fill in the costs and click calculate to see profit breakdown</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}