import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ areaKey: string }> },
) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { areaKey } = await params
  const body = await request.json()
  const { label } = body as { label: string }

  if (!label?.trim()) return NextResponse.json({ error: 'La tarea es requerida' }, { status: 400 })

  const { data: maxRow } = await supabase
    .from('item_templates')
    .select('sort_order')
    .eq('area_key', areaKey)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const sort_order = (maxRow?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('item_templates')
    .insert({ area_key: areaKey, label: label.trim(), sort_order })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al crear tarea' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
