import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { getActiveAreas } from '@/lib/area-definitions-db'
import type { Checklist, ChecklistItem } from '@/lib/types'
import type { ExportData } from '@/lib/export-utils'
import AutoRefresh from './_components/AutoRefresh'
import ExportButtons from './_components/ExportButtons'
import { AlertTriangle, Clock } from 'lucide-react'

function calcProgress(checklist: (Checklist & { checklist_items: ChecklistItem[] }) | undefined) {
  if (!checklist) return 0
  const items = checklist.checklist_items ?? []
  if (items.length === 0) return 0
  return Math.round((items.filter((i) => i.is_completed).length / items.length) * 100)
}

function StatusBar({ progress }: { progress: number }) {
  const color = progress === 100 ? 'bg-green-500' : progress > 0 ? 'bg-accent' : 'bg-slate-200'
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${progress}%` }} />
    </div>
  )
}

function StatusDot({ progress }: { progress: number }) {
  const color = progress === 100 ? 'bg-green-500' : progress > 0 ? 'bg-accent' : 'bg-slate-300'
  return <span className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${color}`} />
}

export default async function AdminPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin' && session.role !== 'dueno') redirect('/dashboard')

  const today = new Date().toISOString().split('T')[0]

  const [activeAreas, checklistsResult] = await Promise.all([
    getActiveAreas(),
    supabase
      .from('checklists')
      .select('*, checklist_items(*), users(name)')
      .eq('date', today),
  ])

  const { data: checklists } = checklistsResult

  type ChecklistWithUser = Checklist & { checklist_items: ChecklistItem[]; users: { name: string } | null }

  const byArea = new Map<string, ChecklistWithUser>()
  for (const c of (checklists ?? []) as ChecklistWithUser[]) {
    byArea.set(c.area_id, c)
  }

  const alertItems = (checklists ?? []).flatMap((c) =>
    ((c as ChecklistWithUser).checklist_items ?? [])
      .filter((i) => i.note)
      .map((i) => ({
        ...i,
        area_id: (c as ChecklistWithUser).area_id,
        userName: (c as ChecklistWithUser).users?.name ?? 'Empleado',
      }))
  )

  const recentActivity = (checklists ?? [])
    .flatMap((c) =>
      ((c as ChecklistWithUser).checklist_items ?? [])
        .filter((i) => i.is_completed && i.completed_at)
        .map((i) => ({
          label: i.label,
          area_id: (c as ChecklistWithUser).area_id,
          completed_at: i.completed_at!,
          userName: (c as ChecklistWithUser).users?.name ?? 'Empleado',
        }))
    )
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
    .slice(0, 15)

  const todayLabel = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const exportData: ExportData = {
    date: today,
    selectedArea: null,
    checklists: ((checklists ?? []) as ChecklistWithUser[]).map((c) => ({
      area_id: c.area_id,
      areaLabel: activeAreas.find((a) => a.area_key === c.area_id)?.label ?? c.area_id,
      date: today,
      status: c.status,
      userName: c.users?.name ?? 'Sin asignar',
      checklist_items: (c.checklist_items ?? []).map((i) => ({
        label: i.label,
        is_completed: i.is_completed,
        completed_at: i.completed_at,
        note: i.note,
      })),
      cashDetails: null,
    })),
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl">
      <AutoRefresh interval={30000} />

      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-slate-400 uppercase tracking-widest text-xs font-light">{todayLabel}</p>
          <h1 className="text-3xl font-bold text-slate-800 uppercase mt-0.5">Panel de Control</h1>
        </div>
        {(checklists ?? []).length > 0 && (
          <div className="mt-1">
            <ExportButtons data={exportData} filename={`panel-${today}`} />
          </div>
        )}
      </div>

      {/* Grid de áreas dinámicas (agrupadas si tienen group_label) */}
      {activeAreas.length > 0 && (() => {
        // Separar áreas en grupos y sueltas
        const grouped = new Map<string, typeof activeAreas>()
        const standalone: typeof activeAreas = []
        for (const area of activeAreas) {
          if (area.group_label) {
            const g = grouped.get(area.group_label) ?? []
            g.push(area)
            grouped.set(area.group_label, g)
          } else {
            standalone.push(area)
          }
        }

        function AreaSection({ area }: { area: typeof activeAreas[0] }) {
          const cl = byArea.get(area.area_key)
          const items = cl?.checklist_items ?? []
          const progress = calcProgress(cl)
          const user = cl?.users?.name
          const done = items.filter((i) => i.is_completed).length

          return (
            <div>
              {/* Sub-header */}
              <div className="mb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-slate-700 text-sm leading-tight">{area.label}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${
                    progress === 100 ? 'bg-green-100 text-green-700' :
                    progress > 0    ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100 text-slate-400'
                  }`}>
                    {done}/{items.length}
                  </span>
                </div>
                <StatusBar progress={progress} />
                {user && (
                  <p className="text-xs text-slate-400 mt-1.5">{user}</p>
                )}
              </div>

              {/* Lista de tareas */}
              <div className="flex flex-col">
                {items.length === 0 ? (
                  <p className="text-xs text-slate-300 py-2">Sin actividad hoy.</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="py-2 border-t border-slate-50 first:border-t-0">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
                          item.is_completed
                            ? 'bg-green-100 text-green-600'
                            : 'border-2 border-slate-200'
                        }`}>
                          {item.is_completed && (
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <path d="M1 3.5L3.5 6L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className={`flex-1 text-xs leading-snug ${
                          item.is_completed ? 'text-slate-400 line-through decoration-slate-200' : 'text-slate-700'
                        }`}>
                          {item.label}
                        </span>
                        {item.completed_at && (
                          <span className="text-slate-300 text-xs tabular-nums flex-shrink-0 ml-1">
                            {new Date(item.completed_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {item.note && (
                        <div className="ml-6 mt-1">
                          <span className="inline-flex items-center gap-1 text-xs text-brand italic bg-red-50 px-2 py-0.5 rounded-md">
                            ⚠ {item.note}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        }

        return (
          <div className="flex flex-col gap-4 mb-6">
            {/* Grupos */}
            {[...grouped.entries()].map(([groupLabel, areas]) => (
              <div key={groupLabel} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header de grupo */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
                  <p className="font-bold text-slate-600 uppercase tracking-widest text-xs">{groupLabel}</p>
                </div>
                {/* Sub-secciones: columnas en desktop, apiladas en mobile */}
                <div className={`grid ${areas.length >= 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {areas.map((area, i) => (
                    <div
                      key={area.area_key}
                      className={`px-6 py-5 ${
                        areas.length >= 2 && i < areas.length - 1
                          ? 'border-b md:border-b-0 md:border-r border-slate-100'
                          : ''
                      }`}
                    >
                      <AreaSection area={area} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Áreas sueltas (sin grupo) */}
            {standalone.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {standalone.map((area) => (
                  <div key={area.area_key} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="px-6 py-5">
                      <AreaSection area={area} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alertas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-brand" strokeWidth={2} />
            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Alertas del día</h3>
          </div>
          {alertItems.length === 0 ? (
            <p className="text-sm text-slate-400">Sin alertas hoy.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {alertItems.map((item) => (
                <div key={item.id} className="bg-brand-light border border-brand/20 rounded-xl p-3">
                  <p className="text-xs font-semibold text-brand uppercase tracking-wide">{item.userName}</p>
                  <p className="text-xs text-slate-700 mt-1">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-1 italic">"{item.note}"</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actividad */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-slate-400" strokeWidth={1.5} />
            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Actividad reciente</h3>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">Sin actividad hoy.</p>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto">
              {recentActivity.map((act, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <span className="text-slate-400 tabular-nums w-12 flex-shrink-0 pt-0.5">
                    {new Date(act.completed_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <p className="text-slate-600 leading-snug">
                    <span className="font-semibold text-slate-800">{act.userName}</span> — {act.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
