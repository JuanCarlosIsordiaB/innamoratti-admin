import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Solo el admin puede editar usuarios' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (body.name) update.name = body.name
  if (body.role) update.role = body.role
  if (typeof body.is_active === 'boolean') update.is_active = body.is_active
  if (body.code) {
    update.access_code = await bcrypt.hash(body.code, 10)
    update.code_display = body.code
  }

  const { data, error } = await supabase
    .from('users')
    .update(update)
    .eq('id', id)
    .select('id, name, role, code_display, is_active')
    .single()

  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Solo el admin puede desactivar usuarios' }, { status: 403 })
  }

  const { id } = await params

  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Error al desactivar' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
