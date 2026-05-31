import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin' && session.role !== 'dueno') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, code_display, is_active, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Solo el admin puede crear usuarios' }, { status: 403 })
  }

  const { name, role, code } = await request.json()

  if (!name || !role || !code) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data: roleRow } = await supabase
    .from('roles')
    .select('role_key')
    .eq('role_key', role)
    .maybeSingle()
  if (!roleRow) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })

  const hashedCode = await bcrypt.hash(code, 10)

  const { data, error } = await supabase
    .from('users')
    .insert({ name, role, access_code: hashedCode, code_display: code })
    .select('id, name, role, code_display, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
