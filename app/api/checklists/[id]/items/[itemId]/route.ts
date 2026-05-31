import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { itemId } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (typeof body.is_completed === 'boolean') {
    update.is_completed = body.is_completed
    update.completed_at = body.is_completed ? new Date().toISOString() : null
    update.completed_by = body.is_completed ? session.userId : null
  }
  if (typeof body.note === 'string') {
    update.note = body.note || null
  }

  const { data, error } = await supabase
    .from('checklist_items')
    .update(update)
    .eq('id', itemId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })

  return NextResponse.json(data)
}
