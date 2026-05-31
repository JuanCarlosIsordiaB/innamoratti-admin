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
  if (session.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { data, error } = await supabase
    .from('area_templates')
    .select('*, item_templates(id, label, sort_order, area_key, created_at)')
    .order('sort_order')

  if (error) return NextResponse.json({ error: 'Error al obtener secciones' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const body = await request.json()
  const { label, role_access, group_label } = body as { label: string; role_access: string[]; group_label?: string | null }

  if (!label?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  const base = slugify(label.trim()) || 'seccion'
  const area_key = `${base}_${Date.now().toString(36)}`

  const { data: maxRow } = await supabase
    .from('area_templates')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sort_order = (maxRow?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('area_templates')
    .insert({ area_key, label: label.trim(), role_access: role_access ?? [], sort_order, group_label: group_label ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al crear sección' }, { status: 500 })
  return NextResponse.json({ ...data, item_templates: [] }, { status: 201 })
}
