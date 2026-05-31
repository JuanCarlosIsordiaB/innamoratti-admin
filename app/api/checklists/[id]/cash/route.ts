import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (session.role !== 'cajero' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Rol no permitido' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('cash_close_details')
    .upsert({
      checklist_id: id,
      denom_1000: body.denom_1000 ?? 0,
      denom_500: body.denom_500 ?? 0,
      denom_200: body.denom_200 ?? 0,
      denom_100: body.denom_100 ?? 0,
      denom_50: body.denom_50 ?? 0,
      denom_20: body.denom_20 ?? 0,
      denom_10: body.denom_10 ?? 0,
      denom_5: body.denom_5 ?? 0,
      denom_1: body.denom_1 ?? 0,
      total_counted: body.total_counted ?? 0,
      fund_amount: body.fund_amount ?? 1500,
      sales_amount: body.sales_amount ?? 0,
      digital_signature: body.digital_signature ?? '',
    }, { onConflict: 'checklist_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })

  return NextResponse.json(data)
}
