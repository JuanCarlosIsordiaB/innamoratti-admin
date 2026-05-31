import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export async function GET(request: NextRequest) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin' && session.role !== 'dueno') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('is_system', { ascending: false })
    .order('label', { ascending: true })

  if (error) return NextResponse.json({ error: 'Error al obtener roles' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const body = await request.json()
  const { label } = body as { label: string }

  if (!label?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  const base = slugify(label.trim()) || 'rol'
  const role_key = `${base}_${Date.now().toString(36)}`

  const { data, error } = await supabase
    .from('roles')
    .insert({ role_key, label: label.trim(), is_system: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al crear rol' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
