import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { AppRole } from '@/lib/types'
import NuevoUsuarioForm from './NuevoUsuarioForm'

export default async function NuevoUsuarioPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/admin/usuarios')

  const { data: roles } = await supabase
    .from('roles')
    .select('*')
    .order('is_system', { ascending: false })
    .order('label')

  return <NuevoUsuarioForm roles={(roles ?? []) as AppRole[]} />
}
