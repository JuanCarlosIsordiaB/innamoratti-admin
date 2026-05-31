import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ areaKey: string }> },
) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { areaKey } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (typeof body.label === 'string' && body.label.trim()) update.label = body.label.trim()
  if (Array.isArray(body.role_access)) update.role_access = body.role_access
  if (typeof body.sort_order === 'number') update.sort_order = body.sort_order
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active
  if ('group_label' in body) update.group_label = body.group_label ?? null

  const { data, error } = await supabase
    .from('area_templates')
    .update(update)
    .eq('area_key', areaKey)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar sección' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ areaKey: string }> },
) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { areaKey } = await params

  const { error } = await supabase
    .from('area_templates')
    .delete()
    .eq('area_key', areaKey)

  if (error) return NextResponse.json({ error: 'Error al eliminar sección' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
