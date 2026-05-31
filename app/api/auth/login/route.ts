import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { createSession } from '@/lib/auth'
import type { User } from '@/lib/types'

export async function POST(request: NextRequest) {
  const { code } = await request.json()

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }

  let matchedUser: User | null = null
  for (const user of users as User[]) {
    const valid = await bcrypt.compare(code, user.access_code)
    if (valid) {
      matchedUser = user
      break
    }
  }

  if (!matchedUser) {
    return NextResponse.json({ error: 'Código incorrecto o usuario inactivo' }, { status: 401 })
  }

  await createSession(matchedUser.id, matchedUser.role, matchedUser.name)

  return NextResponse.json({ role: matchedUser.role })
}
