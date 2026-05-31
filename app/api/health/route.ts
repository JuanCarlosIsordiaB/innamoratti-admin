import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { error } = await supabase.from('users').select('id').limit(1)
  if (error) return NextResponse.json({ status: 'error', message: error.message }, { status: 503 })
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
