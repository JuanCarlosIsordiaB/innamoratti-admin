'use client'

import { useState } from 'react'
import { Lock, Plus, Trash2, X } from 'lucide-react'
import type { AppRole } from '@/lib/types'

interface Props {
  roles: AppRole[]
  isReadOnly: boolean
}

export default function RolesClient({ roles: initial, isReadOnly }: Props) {
  const [roles, setRoles] = useState<AppRole[]>(initial)
  const [modal, setModal] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function createRole() {
    if (!newLabel.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLabel.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al crear rol')
    } else {
      setRoles((prev) => [...prev, data])
      setModal(false)
      setNewLabel('')
    }
    setSaving(false)
  }

  async function deleteRole(roleKey: string) {
    if (!confirm('¿Eliminar este rol? Asegúrate de que ningún usuario lo tenga asignado.')) return
    const res = await fetch(`/api/admin/roles/${roleKey}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error ?? 'Error al eliminar rol')
    } else {
      setRoles((prev) => prev.filter((r) => r.role_key !== roleKey))
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Roles</h1>
        {!isReadOnly && (
          <button
            onClick={() => { setModal(true); setNewLabel(''); setError('') }}
            className="flex items-center gap-2 bg-brand text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-brand-dark transition-colors"
          >
            <Plus size={16} strokeWidth={2} />
            Nuevo rol
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {roles.map((role) => (
            <div key={role.role_key} className="flex items-center gap-4 px-5 py-4">
              {role.is_system ? (
                <Lock size={16} className="text-slate-300 flex-shrink-0" strokeWidth={1.5} />
              ) : (
                <div className="w-4 flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{role.label}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{role.role_key}</p>
              </div>

              {role.is_system ? (
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">
                  Sistema
                </span>
              ) : (
                !isReadOnly && (
                  <button
                    onClick={() => deleteRole(role.role_key)}
                    className="text-slate-300 hover:text-red-500 flex-shrink-0 transition-colors"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                )
              )}
            </div>
          ))}

          {roles.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">Sin roles configurados.</p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Para asignar secciones a un rol, ve a <strong>Secciones</strong> → edita una sección → selecciona los roles con acceso.
      </p>

      {/* Modal nuevo rol */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">Nuevo rol</h2>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1.5">
              Nombre del rol
            </label>
            <input
              autoFocus
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') createRole() }}
              placeholder="Ej: Bartender, Encargado de Terraza..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
            />
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createRole}
                disabled={saving || !newLabel.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-brand hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Creando...' : 'Crear rol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
