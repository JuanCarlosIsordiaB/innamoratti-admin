import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

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
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })

  return NextResponse.json(data)
}
