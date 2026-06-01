import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { User, AppRole } from '@/lib/types'
import UserActions from './_components/UserActions'

export default async function UsuariosPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin' && session.role !== 'dueno') redirect('/dashboard')

  const [{ data: users }, { data: rolesData }] = await Promise.all([
    supabase.from('users').select('*').order('created_at', { ascending: true }),
    supabase.from('roles').select('*').order('is_system', { ascending: false }).order('label'),
  ])

  const roles = (rolesData ?? []) as AppRole[]
  const roleLabels = Object.fromEntries(roles.map((r) => [r.role_key, r.label]))

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
        {session.role === 'admin' && (
          <Link
            href="/admin/usuarios/nuevo"
            className="bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            + Nuevo empleado
          </Link>
        )}
      </div>

      {/* Cards — mobile */}
      <div className="md:hidden flex flex-col gap-3">
        {(users as User[])?.map((user) => (
          <div key={user.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-4 flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1.5 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{user.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {roleLabels[user.role] ?? user.role}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {user.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {session.role === 'admin' && (
                <p className="font-mono text-xs text-slate-400">{user.code_display}</p>
              )}
            </div>
            {session.role === 'admin' && (
              <div className="shrink-0">
                <UserActions user={user} roles={roles} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabla — desktop */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Rol</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Código</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Estado</th>
              {session.role === 'admin' && (
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {(users as User[])?.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">{user.name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">
                    {roleLabels[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-500 text-xs">
                  {session.role === 'admin' ? user.code_display : '****'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                {session.role === 'admin' && (
                  <td className="px-4 py-3 text-right">
                    <UserActions user={user} roles={roles} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
