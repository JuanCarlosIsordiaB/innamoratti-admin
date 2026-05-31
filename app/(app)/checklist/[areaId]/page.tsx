import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getAreaForRole, getItemTemplatesByArea } from '@/lib/area-definitions-db'
import type { Checklist, ChecklistItem, CashCloseDetails } from '@/lib/types'
import ChecklistClient from './ChecklistClient'

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ areaId: string }>
}) {
  const { areaId } = await params
  const session = await getSession()
  if (!session) redirect('/login')

  const area = await getAreaForRole(areaId, session.role)
  if (!area) redirect('/dashboard')

  const itemTemplates = await getItemTemplatesByArea(areaId)
  if (itemTemplates.length === 0) notFound()

  const today = new Date().toISOString().split('T')[0]

  let { data: checklist } = await supabase
    .from('checklists')
    .select('*, checklist_items(*)')
    .eq('area_id', areaId)
    .eq('date', today)
    .maybeSingle()

  if (!checklist) {
    const { data: newChecklist, error } = await supabase
      .from('checklists')
      .insert({ area_id: areaId, user_id: session.userId, date: today })
      .select()
      .single()

    if (error || !newChecklist) redirect('/dashboard')

    await supabase.from('checklist_items').insert(
      itemTemplates.map((item) => ({
        checklist_id: newChecklist.id,
        item_key: item.id,
        label: item.label,
        is_completed: false,
      }))
    )

    const { data: fresh } = await supabase
      .from('checklists')
      .select('*, checklist_items(*)')
      .eq('id', newChecklist.id)
      .single()

    checklist = fresh
  }

  if (!checklist) redirect('/dashboard')

  let cashDetails: CashCloseDetails | null = null
  if (areaId === 'caja_cierre') {
    const { data } = await supabase
      .from('cash_close_details')
      .select('*')
      .eq('checklist_id', checklist.id)
      .maybeSingle()
    cashDetails = data
  }

  return (
    <ChecklistClient
      checklist={checklist as Checklist & { checklist_items: ChecklistItem[] }}
      areaId={areaId}
      areaLabel={area.label}
      userName={session.name}
      cashDetails={cashDetails}
    />
  )
}
