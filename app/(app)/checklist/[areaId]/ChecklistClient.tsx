'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Checklist, ChecklistItem, CashCloseDetails } from '@/lib/types'

interface Props {
  checklist: Checklist & { checklist_items: ChecklistItem[] }
  areaId: string
  areaLabel: string
  userName: string
  cashDetails: CashCloseDetails | null
}

const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1] as const

export default function ChecklistClient({ checklist, areaId, areaLabel, userName, cashDetails: initialCash }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<ChecklistItem[]>(checklist.checklist_items)
  const [noteOpen, setNoteOpen] = useState<string | null>(null)
  const [noteText, setNoteText] = useState<Record<string, string>>({})
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(checklist.status === 'completed')
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const [denoms, setDenoms] = useState<Record<number, number>>(
    initialCash
      ? {
          1000: initialCash.denom_1000, 500: initialCash.denom_500,
          200: initialCash.denom_200, 100: initialCash.denom_100,
          50: initialCash.denom_50, 20: initialCash.denom_20,
          10: initialCash.denom_10, 5: initialCash.denom_5, 1: initialCash.denom_1,
        }
      : Object.fromEntries(DENOMINATIONS.map((d) => [d, 0]))
  )
  const [salesAmount, setSalesAmount] = useState(initialCash?.sales_amount?.toString() ?? '')

  const totalCounted = DENOMINATIONS.reduce((sum, d) => sum + d * (denoms[d] || 0), 0)
  const fundAmount = 1500
  const completed = items.filter((i) => i.is_completed).length
  const total = items.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const allDone = completed === total

  useEffect(() => {
    const initial: Record<string, string> = {}
    for (const item of items) { if (item.note) initial[item.id] = item.note }
    setNoteText(initial)
  }, [])

  async function toggleItem(item: ChecklistItem) {
    if (signed) return
    setSaving((s) => ({ ...s, [item.id]: true }))
    const newVal = !item.is_completed
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_completed: newVal } : i)))
    await fetch(`/api/checklists/${checklist.id}/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: newVal }),
    })
    setSaving((s) => ({ ...s, [item.id]: false }))
  }

  async function saveNote(itemId: string) {
    await fetch(`/api/checklists/${checklist.id}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: noteText[itemId] ?? '' }),
    })
    setNoteOpen(null)
  }

  async function handleSign() {
    if (!allDone || signed || signing) return
    setSigning(true)
    if (areaId === 'caja_cierre') {
      await fetch(`/api/checklists/${checklist.id}/cash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(DENOMINATIONS.map((d) => [`denom_${d}`, denoms[d] || 0])),
          total_counted: totalCounted, fund_amount: fundAmount,
          sales_amount: parseFloat(salesAmount) || 0, digital_signature: userName,
        }),
      })
    }
    await fetch(`/api/checklists/${checklist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', digital_signature: userName }),
    })
    setSigned(true)
    setSigning(false)
  }

  return (
    <main className="min-h-screen bg-brand flex flex-col">
      {/* Header rojo sticky */}
      <header className="bg-brand px-4 pt-8 pb-5 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push('/dashboard')} className="text-white/60 hover:text-white text-2xl leading-none">←</button>
          <div className="flex-1">
            <p className="text-white/50 uppercase tracking-widest text-xs font-light">Checklist</p>
            <h1 className="font-bold text-white uppercase text-xl leading-tight">{areaLabel}</h1>
          </div>
          {signed && (
            <span className="text-xs bg-white/20 text-white font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
              Firmado ✓
            </span>
          )}
        </div>

        {/* Barra de progreso */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/20 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-400' : 'bg-accent'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-white/80 text-xs font-semibold tabular-nums w-10 text-right">{progress}%</span>
        </div>
      </header>

      {/* Contenido blanco */}
      <div className="flex-1 bg-white rounded-t-3xl px-4 pt-5 pb-8">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-4 font-light">{completed}/{total} tareas completadas</p>

        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border transition-colors ${item.is_completed ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex items-center gap-4 p-4">
                <button
                  onClick={() => toggleItem(item)}
                  disabled={signed || saving[item.id]}
                  className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    item.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-brand'
                  }`}
                >
                  {item.is_completed && <span className="text-sm leading-none">✓</span>}
                </button>

                <span className={`flex-1 text-sm leading-snug ${item.is_completed ? 'text-green-700 line-through' : 'text-slate-700'}`}>
                  {item.label}
                </span>

                <button
                  onClick={() => setNoteOpen(noteOpen === item.id ? null : item.id)}
                  className={`text-xs px-2 py-1 rounded-lg flex-shrink-0 transition-colors ${
                    item.note ? 'bg-accent/30 text-slate-700 font-semibold' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {item.note ? '⚠ Alerta' : '+ Nota'}
                </button>
              </div>

              {noteOpen === item.id && (
                <div className="px-4 pb-4 flex gap-2">
                  <input
                    type="text"
                    value={noteText[item.id] ?? ''}
                    onChange={(e) => setNoteText((n) => ({ ...n, [item.id]: e.target.value }))}
                    placeholder="Describe el problema..."
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
                  />
                  <button onClick={() => saveNote(item.id)} className="text-sm bg-brand text-white px-3 py-2 rounded-lg hover:bg-brand-dark">
                    Guardar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Calculadora de caja */}
        {areaId === 'caja_cierre' && (
          <div className="mt-4 bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-800 uppercase tracking-widest text-xs mb-4">Calculadora de Denominaciones</h2>
            <div className="flex flex-col gap-3">
              {DENOMINATIONS.map((denom) => (
                <div key={denom} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600 font-mono w-16">${denom}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setDenoms((d) => ({ ...d, [denom]: Math.max(0, (d[denom] || 0) - 1) }))}
                      className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center">−</button>
                    <input type="number" min="0" value={denoms[denom] || 0}
                      onChange={(e) => setDenoms((d) => ({ ...d, [denom]: parseInt(e.target.value) || 0 }))}
                      className="w-14 text-center border border-slate-200 rounded-lg py-1 text-sm focus:outline-none focus:border-accent" />
                    <button onClick={() => setDenoms((d) => ({ ...d, [denom]: (d[denom] || 0) + 1 }))}
                      className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center">+</button>
                  </div>
                  <span className="text-sm font-mono text-slate-500 w-20 text-right">${(denom * (denoms[denom] || 0)).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 uppercase tracking-wide text-xs">Total contado</span>
                <span className="font-bold text-slate-800 text-lg">${totalCounted.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Fondo caja</span><span>${fundAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs gap-3">
                <span className="text-slate-400">Ventas del día</span>
                <input type="number" value={salesAmount} onChange={(e) => setSalesAmount(e.target.value)}
                  placeholder="0.00" className="w-28 text-right border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>
          </div>
        )}

        {/* Botón firma */}
        {!signed && (
          <button
            onClick={handleSign}
            disabled={!allDone || signing}
            className={`mt-5 w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all ${
              allDone ? 'bg-brand hover:bg-brand-dark text-white active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            {signing ? 'Guardando...' : allDone ? `Confirmar · ${userName}` : `Faltan ${total - completed} tareas`}
          </button>
        )}

        {signed && (
          <div className="mt-5 bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-center">
            <p className="text-green-700 font-bold text-lg uppercase tracking-wide">✓ Completado</p>
            <p className="text-green-600 text-sm mt-1">Firmado por {userName}</p>
          </div>
        )}
      </div>
    </main>
  )
}
