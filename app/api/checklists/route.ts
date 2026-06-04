import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getAreaKeysByRole } from '@/lib/area-definitions-db'

export async function GET(request: NextRequest) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  const areas = await getAreaKeysByRole(session.role)

  const { data, error } = await supabase
    .from('checklists')
    .select('*, checklist_items(*), users(name)')
    .eq('date', date)
    .in('area_id', areas.length > 0 ? areas : ['__none__'])

  if (error) return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })

  return NextResponse.json(data)
}
