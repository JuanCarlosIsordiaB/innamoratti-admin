import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { sendSectionCompletedEmail } from '@/lib/email'
import { getActiveAreas } from '@/lib/area-definitions-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const { data, error } = await supabase
    .from('checklists')
    .select('*, checklist_items(*)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (body.status) {
    update.status = body.status
    if (body.status === 'completed') update.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('checklists')
    .update(update)
    .eq('id', id)
    .select('*, users(name)')
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })

  if (body.status === 'completed') {
    const areas = await getActiveAreas()
    const areaLabel = areas.find((a) => a.area_key === data.area_id)?.label ?? data.area_id
    const userName = (data as Record<string, unknown> & { users?: { name: string } | null }).users?.name ?? 'Empleado'
    sendSectionCompletedEmail({
      areaLabel,
      userName,
      completedAt: data.completed_at ?? new Date().toISOString(),
    }).catch(() => {})
  }

  return NextResponse.json(data)
}
