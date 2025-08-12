'use client';
import { useEffect, useMemo, useState } from 'react';
import './globals.css';
import { defaultMultipliers, fetchTeleportMultiplier, CountryKey } from '../lib/costMultipliers';
import { computePlan, type CountryConfig, type Inputs } from '../lib/calc';

type RateMap = Record<string, number>;
const START_COUNTRIES: CountryKey[] = ['Portugal','Italy','France','UK','Spain','Vietnam'];

export default function Page(){
  const [rates, setRates] = useState<RateMap>({ USD: 1 });
  const [countries, setCountries] = useState<CountryConfig[]>(START_COUNTRIES.map(c=>({country:c, months:1, multiplier: defaultMultipliers[c]})));
  const [inputs, setInputs] = useState<Inputs>({ baselinePerPersonUSD:2100, extrasPerPersonUSD:700, numPeople:1, sharedBaselineFraction:0.6, sharedExtrasFraction:0.1, monthlyIncomeUSD:0, emergencyPercent:8 });
  const [loadingTeleport, setLoadingTeleport] = useState(false);
  useEffect(()=>{(async()=>{ try{ const r=await fetch('https://api.exchangerate.host/latest?base=USD'); const d=await r.json(); setRates(d.rates||{USD:1}) }catch{ setRates({USD:1}) } })()},[]);
  async function refreshTeleport(){ setLoadingTeleport(true); try{ const updated = await Promise.all(countries.map(async(c)=>{ const m = await fetchTeleportMultiplier(c.country as CountryKey); return {...c, multiplier: m ?? c.multiplier}; })); setCountries(updated) } finally { setLoadingTeleport(false) } }
  const outputs = useMemo(()=>computePlan(countries, inputs), [countries, inputs]);
  function setCountryMonths(i:number, v:number){ const list=[...countries]; list[i]={...list[i], months: Math.max(0, Math.floor(v))}; setCountries(list) }
  function setCountryMultiplier(i:number, v:number){ const list=[...countries]; list[i]={...list[i], multiplier: Math.max(0.1, v)}; setCountries(list) }
  const monthsTotal = outputs.totals.months || countries.reduce((s,c)=>s+c.months,0);
  return (
    <main className="min-h-screen p-6 md:p-10 bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto grid gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold">Travel Budget Simulator</h1>
          <button onClick={refreshTeleport} disabled={loadingTeleport} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm">{loadingTeleport?'Refreshing…':'Use live multipliers'}</button>
        </header>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="bg-[#111827] rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold">People & comfort</h2>
            <label className="block text-sm text-[#9ca3af]">Number of people</label>
            <input type="number" min={1} max={2} value={inputs.numPeople} onChange={e=>setInputs(s=>({...s, numPeople: Math.max(1, Math.min(2, Number(e.target.value)||1))}))} className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2"/>
            <label className="block text-sm text-[#9ca3af]">Baseline per person USD</label>
            <input type="number" value={inputs.baselinePerPersonUSD} onChange={e=>setInputs(s=>({...s, baselinePerPersonUSD: Number(e.target.value)||0}))} className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2"/>
            <label className="block text-sm text-[#9ca3af]">Extras per person USD</label>
            <input type="number" value={inputs.extrasPerPersonUSD} onChange={e=>setInputs(s=>({...s, extrasPerPersonUSD: Number(e.target.value)||0}))} className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2"/>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#9ca3af]">Shared baseline %</label>
                <input type="number" min={0} max={100} value={Math.round(inputs.sharedBaselineFraction*100)} onChange={e=>setInputs(s=>({...s, sharedBaselineFraction: Math.max(0, Math.min(100, Number(e.target.value)||0))/100}))} className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2"/>
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af]">Shared extras %</label>
                <input type="number" min={0} max={100} value={Math.round(inputs.sharedExtrasFraction*100)} onChange={e=>setInputs(s=>({...s, sharedExtrasFraction: Math.max(0, Math.min(100, Number(e.target.value)||0))/100}))} className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2"/>
              </div>
            </div>
          </div>

          <div className="bg-[#111827] rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold">Money</h2>
            <label className="block text-sm text-[#9ca3af]">Monthly income USD</label>
            <input type="number" value={inputs.monthlyIncomeUSD} onChange={e=>setInputs(s=>({...s, monthlyIncomeUSD: Number(e.target.value)||0}))} className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2"/>
            <label className="block text-sm text-[#9ca3af]">Emergency fund %</label>
            <input type="number" min={0} max={100} value={inputs.emergencyPercent} onChange={e=>setInputs(s=>({...s, emergencyPercent: Math.max(0, Math.min(100, Number(e.target.value)||0))}))} className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2"/>
            <div className="text-sm text-[#9ca3af]">FX rates load automatically</div>
          </div>

          <div className="bg-[#111827] rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold">Summary</h2>
            <div className="space-y-1 text-sm">
              <div>Months total: <span className="text-white">{monthsTotal}</span></div>
              <div>Baseline: <span className="text-white">${'{'}outputs.totals.baselineUSD.toFixed(0){'}'}</span></div>
              <div>Extras: <span className="text-white">${'{'}outputs.totals.extrasUSD.toFixed(0){'}'}</span></div>
              <div>Subtotal: <span className="text-white">${'{'}outputs.totals.subtotalUSD.toFixed(0){'}'}</span></div>
              <div>Emergency: <span className="text-white">${'{'}outputs.totals.emergencyUSD.toFixed(0){'}'}</span></div>
              <div className="font-semibold">Grand total: <span className="text-white">${'{'}outputs.totals.grandTotalUSD.toFixed(0){'}'}</span></div>
              <div>Monthly avg: <span className="text-white">${'{'}outputs.totals.monthlyAvgUSD.toFixed(0){'}'}</span></div>
              <div>Your share: <span className="text-white">${'{'}outputs.totals.yourShareUSD.toFixed(0){'}'}</span></div>
              { '{' }inputs.numPeople===2 && <div>Partner share: <span className="text-white">${'{'}outputs.totals.partnerShareUSD.toFixed(0){'}'}</span></div>{ '}' }
            </div>
          </div>
        </section>

        <section className="bg-[#111827] rounded-2xl p-4">
          <h2 className="font-semibold mb-4">Countries</h2>
          <div className="grid gap-3">
            { '{' }countries.map((c, idx) => (
              <div key={idx} className="grid grid-cols-12 items-center gap-3 bg-white/5 rounded-xl p-3">
                <div className="col-span-3 md:col-span-3 font-medium">{ '{' }c.country{ '}' }</div>
                <div className="col-span-3 md:col-span-2">
                  <label className="block text-xs text-[#9ca3af]">Months</label>
                  <input type="number" min={0} value={ '{' }c.months{ '}' }
                    onChange={e=>setCountryMonths(idx, Number(e.target.value)||0)}
                    className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2"/>
                </div>
                <div className="col-span-4 md:col-span-4">
                  <label className="block text-xs text-[#9ca3af]">Multiplier</label>
                  <input type="number" step="0.05" min={0.1} value={ '{' }c.multiplier{ '}' }
                    onChange={e=>setCountryMultiplier(idx, Number(e.target.value)||1)}
                    className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2"/>
                </div>
                <div className="col-span-12 md:col-span-3 text-sm text-right">
                  <div>Baseline: <span className="text-white">${'{'}(inputs.baselinePerPersonUSD * c.multiplier).toFixed(0){'}'}/mo</span></div>
                  <div>Extras: <span className="text-white">${'{'}(inputs.extrasPerPersonUSD * c.multiplier).toFixed(0){'}'}/mo</span></div>
                </div>
              </div>
            )){ '}' }
          </div>
        </section>

        <section className="bg-[#111827] rounded-2xl p-4">
          <h2 className="font-semibold mb-3">Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[#9ca3af]">
                <tr>
                  <th className="py-2">Country</th>
                  <th>Months</th>
                  <th>Baseline USD</th>
                  <th>Extras USD</th>
                  <th>Subtotal USD</th>
                </tr>
              </thead>
              <tbody>
                { '{' }outputs.byCountry.map((row, i) => (
                  <tr key={i} className="border-t border-white/10">
                    <td className="py-2">{ '{' }row.country{ '}' }</td>
                    <td>{ '{' }row.months{ '}' }</td>
                    <td>${ '{' }row.baselineUSD.toFixed(0){ '}' }</td>
                    <td>${ '{' }row.extrasUSD.toFixed(0){ '}' }</td>
                    <td className="font-medium">${ '{' }row.subtotalUSD.toFixed(0){ '}' }</td>
                  </tr>
                )){ '}' }
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
