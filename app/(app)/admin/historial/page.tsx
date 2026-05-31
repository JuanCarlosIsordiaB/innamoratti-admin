import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { getAreaLabelsMap } from '@/lib/area-definitions-db'
import type { Checklist, ChecklistItem, CashCloseDetails } from '@/lib/types'
import type { ExportData } from '@/lib/export-utils'
import ExportButtons from '../_components/ExportButtons'

type SearchParams = Promise<{ date?: string; area?: string }>

export default async function HistorialPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin' && session.role !== 'dueno') redirect('/dashboard')

  const { date: qDate, area: qArea } = await searchParams
  const selectedDate = qDate ?? new Date().toISOString().split('T')[0]
  const selectedArea = qArea ?? ''

  const areaLabels = await getAreaLabelsMap()

  let query = supabase
    .from('checklists')
    .select('*, checklist_items(*), users(name)')
    .eq('date', selectedDate)
    .order('created_at', { ascending: true })

  if (selectedArea) {
    query = query.eq('area_id', selectedArea)
  }

  const { data: checklists } = await query

  type ChecklistFull = Checklist & { checklist_items: ChecklistItem[]; users: { name: string } | null }

  const cashIds = (checklists ?? [])
    .filter((c) => c.area_id === 'caja_cierre')
    .map((c) => c.id)

  let cashMap = new Map<string, CashCloseDetails>()
  if (cashIds.length > 0) {
    const { data: cashData } = await supabase
      .from('cash_close_details')
      .select('*')
      .in('checklist_id', cashIds)
    for (const cd of cashData ?? []) {
      cashMap.set(cd.checklist_id, cd)
    }
  }

  const exportData: ExportData = {
    date: selectedDate,
    selectedArea: selectedArea || null,
    checklists: ((checklists ?? []) as ChecklistFull[]).map((c) => ({
      area_id: c.area_id,
      areaLabel: areaLabels[c.area_id] ?? c.area_id,
      date: c.date,
      status: c.status,
      userName: c.users?.name ?? 'Sin asignar',
      checklist_items: (c.checklist_items ?? []).map((i) => ({
        label: i.label,
        is_completed: i.is_completed,
        completed_at: i.completed_at,
        note: i.note,
      })),
      cashDetails: cashMap.get(c.id) ?? null,
    })),
  }
  const exportFilename = `historial-${selectedDate}${selectedArea ? `-${selectedArea}` : ''}`

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Historial</h1>
        {(checklists ?? []).length > 0 && (
          <ExportButtons data={exportData} filename={exportFilename} />
        )}
      </div>

      {/* Filtros */}
      <form className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Área</label>
          <select
            name="area"
            defaultValue={selectedArea}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">Todas las áreas</option>
            {Object.entries(areaLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Filtrar
          </button>
        </div>
      </form>

      {/* Resultados */}
      {!checklists || checklists.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <p className="text-slate-400">No hay registros para los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(checklists as ChecklistFull[]).map((checklist) => {
            const items = checklist.checklist_items ?? []
            const done = items.filter((i) => i.is_completed).length
            const total = items.length
            const cash = cashMap.get(checklist.id)

            return (
              <div key={checklist.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{areaLabels[checklist.area_id] ?? checklist.area_id}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {checklist.users?.name ?? 'Sin asignar'} · {done}/{total} tareas
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${checklist.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {checklist.status === 'completed' ? 'Completado' : 'En progreso'}
                  </span>
                </div>

                <div className="px-5 py-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-left pb-2">Tarea</th>
                        <th className="text-center pb-2 w-20">Estado</th>
                        <th className="text-right pb-2 w-24">Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t border-slate-50">
                          <td className="py-1.5 text-slate-700">
                            {item.label}
                            {item.note && (
                              <span className="ml-2 text-brand italic">⚠ {item.note}</span>
                            )}
                          </td>
                          <td className="py-1.5 text-center">
                            {item.is_completed
                              ? <span className="text-green-500">✓</span>
                              : <span className="text-slate-300">—</span>
                            }
                          </td>
                          <td className="py-1.5 text-right text-slate-400">
                            {item.completed_at
                              ? new Date(item.completed_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {cash && (
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Detalle de Corte de Caja</p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                      {[1000, 500, 200, 100, 50, 20, 10, 5, 1].map((d) => {
                        const count = cash[`denom_${d}` as keyof CashCloseDetails] as number
                        if (!count) return null
                        return (
                          <div key={d} className="flex justify-between">
                            <span>${d} × {count}</span>
                            <span>${(d * count).toLocaleString()}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span>Total contado</span>
                        <span>${Number(cash.total_counted).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Ventas del día</span>
                        <span>${Number(cash.sales_amount ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Firma</span>
                        <span>{cash.digital_signature}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
