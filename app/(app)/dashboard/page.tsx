import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getAreaKeysByRole, getAreaLabelsMap } from '@/lib/area-definitions-db'
import type { Checklist, ChecklistItem } from '@/lib/types'
import LogoutButton from '@/app/(app)/_components/LogoutButton'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const [areas, areaLabels] = await Promise.all([
    getAreaKeysByRole(session.role),
    getAreaLabelsMap(),
  ])

  const { data: checklists } = await supabase
    .from('checklists')
    .select('*, checklist_items(*)')
    .eq('date', today)
    .in('area_id', areas.length > 0 ? areas : ['__none__'])

  const checklistMap = new Map<string, Checklist & { checklist_items: ChecklistItem[] }>()
  for (const c of (checklists ?? []) as (Checklist & { checklist_items: ChecklistItem[] })[]) {
    checklistMap.set(c.area_id, c)
  }

  const todayLabel = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const allComplete = areas.every((areaId) => {
    const cl = checklistMap.get(areaId)
    if (!cl) return false
    const items = cl.checklist_items ?? []
    return items.length > 0 && items.every((i) => i.is_completed)
  })

  return (
    <main className="min-h-screen bg-brand flex flex-col">
      {/* Header rojo */}
      <header className="px-5 pt-10 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-light mb-1">{todayLabel}</p>
            <h1 className="text-4xl font-bold text-white uppercase leading-none tracking-tight">
              Mis<br />Tareas
            </h1>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <p className="text-white/80 text-sm font-semibold uppercase tracking-wide leading-none">{session.name}</p>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Sheet blanco */}
      <div className="flex-1 bg-white rounded-t-3xl px-4 pt-6 pb-10">

        {allComplete && areas.length > 0 && (
          <div className="mb-5 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" strokeWidth={2} />
            <div>
              <p className="text-green-700 font-bold text-sm uppercase tracking-wide">Todo completado</p>
              <p className="text-green-600 text-xs">Excelente trabajo hoy.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 max-w-lg mx-auto">
          {areas.map((areaId) => {
            const checklist = checklistMap.get(areaId)
            const items = checklist?.checklist_items ?? []
            const total = items.length
            const completed = items.filter((i) => i.is_completed).length
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0
            const status = checklist?.status ?? 'not_started'
            const done = status === 'completed' || progress === 100

            return (
              <Link
                key={areaId}
                href={`/checklist/${areaId}`}
                className="flex items-center gap-4 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-2xl p-4 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-100' : 'bg-slate-200'}`}>
                  {done
                    ? <CheckCircle2 size={20} className="text-green-500" strokeWidth={2} />
                    : <Circle size={20} className="text-slate-400" strokeWidth={1.5} />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 uppercase tracking-wide text-xs mb-1.5">
                    {areaLabels[areaId] ?? areaId}
                  </p>
                  <div className="w-full bg-slate-200 rounded-full h-1 mb-1">
                    <div
                      className={`h-1 rounded-full transition-all ${done ? 'bg-green-500' : progress > 0 ? 'bg-accent' : 'bg-slate-300'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 tabular-nums">
                    {total > 0 ? `${completed}/${total} tareas` : 'Sin iniciar'} · {progress}%
                  </p>
                </div>

                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" />
              </Link>
            )
          })}

          {areas.length === 0 && (
            <p className="text-center text-slate-400 mt-10 uppercase tracking-widest text-sm">Sin checklists asignados</p>
          )}
        </div>
      </div>
    </main>
  )
}
