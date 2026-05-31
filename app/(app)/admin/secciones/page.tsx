import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getAllAreas } from '@/lib/area-definitions-db'
import type { AppRole } from '@/lib/types'
import SeccionesClient from './SeccionesClient'

export default async function SeccionesPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin' && session.role !== 'dueno') redirect('/dashboard')

  const [areas, { data: rolesData }] = await Promise.all([
    getAllAreas(),
    supabase.from('roles').select('*').order('is_system', { ascending: false }).order('label'),
  ])

  const roles = ((rolesData ?? []) as AppRole[]).filter((r) => !r.is_system)

  return (
    <div className="p-4 md:p-8">
      <SeccionesClient areas={areas} roles={roles} isReadOnly={session.role === 'dueno'} />
    </div>
  )
}
