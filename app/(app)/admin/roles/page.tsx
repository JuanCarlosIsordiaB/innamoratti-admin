import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { AppRole } from '@/lib/types'
import RolesClient from './RolesClient'

export default async function RolesPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin' && session.role !== 'dueno') redirect('/dashboard')

  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .order('is_system', { ascending: false })
    .order('label', { ascending: true })

  return (
    <div className="p-4 md:p-8">
      <RolesClient roles={(roles ?? []) as AppRole[]} isReadOnly={session.role === 'dueno'} />
    </div>
  )
}
