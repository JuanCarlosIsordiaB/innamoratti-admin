import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { ROLE_AREAS } from '@/lib/checklist-definitions'

export async function GET(request: NextRequest) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  const areas = ROLE_AREAS[session.role] ?? []

  const { data, error } = await supabase
    .from('checklists')
    .select('*, checklist_items(*), users(name)')
    .eq('date', date)
    .in('area_id', areas)

  if (error) return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })

  return NextResponse.json(data)
}
