import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roleKey: string }> },
) {
  const session = await verifyRequest(request)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { roleKey } = await params

  const { data: role } = await supabase
    .from('roles')
    .select('is_system')
    .eq('role_key', roleKey)
    .maybeSingle()

  if (!role) return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
  if (role.is_system) {
    return NextResponse.json({ error: 'No se puede eliminar un rol de sistema' }, { status: 400 })
  }

  const { error } = await supabase.from('roles').delete().eq('role_key', roleKey)

  if (error) {
    const isFK = error.code === '23503'
    return NextResponse.json(
      { error: isFK ? 'Hay usuarios con este rol. Reasígnalos antes de eliminar.' : 'Error al eliminar rol' },
      { status: 400 },
    )
  }

  return NextResponse.json({ ok: true })
}
