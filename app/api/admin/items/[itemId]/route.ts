import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { itemId } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (typeof body.label === 'string' && body.label.trim()) update.label = body.label.trim()
  if (typeof body.sort_order === 'number') update.sort_order = body.sort_order

  const { data, error } = await supabase
    .from('item_templates')
    .update(update)
    .eq('id', itemId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar tarea' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { itemId } = await params

  const { error } = await supabase.from('item_templates').delete().eq('id', itemId)

  if (error) return NextResponse.json({ error: 'Error al eliminar tarea' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
