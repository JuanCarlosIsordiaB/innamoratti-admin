'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User, AppRole } from '@/lib/types'

export default function UserActions({ user, roles }: { user: User; roles: AppRole[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState(user.role)
  const [newCode, setNewCode] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const body: Record<string, string> = { name, role }
    if (newCode.trim()) body.code = newCode.trim()

    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    setEditing(false)
    setNewCode('')
    router.refresh()
  }

  async function toggleActive() {
    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !user.is_active }),
    })
    router.refresh()
  }

  if (!editing) {
    return (
      <div className="flex gap-2 justify-end">
        <button onClick={() => setEditing(true)} className="text-xs text-brand hover:text-brand-dark font-medium">
          Editar
        </button>
        <button
          onClick={toggleActive}
          className={`text-xs font-medium ${user.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
        >
          {user.is_active ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    )
  }

  const roleSelect = (size: 'sm' | 'xs') => (
    <select
      value={role}
      onChange={(e) => setRole(e.target.value)}
      className={`w-full border border-slate-200 rounded-lg focus:outline-none focus:border-accent ${size === 'sm' ? 'text-sm px-3 py-2' : 'text-xs px-2 py-1'}`}
    >
      {roles.map((r) => (
        <option key={r.role_key} value={r.role_key}>{r.label}</option>
      ))}
    </select>
  )

  return (
    <>
      {/* Mobile — bottom sheet */}
      <div className="md:hidden fixed inset-0 z-50 flex items-end">
        <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(false)} />
        <div className="relative bg-white rounded-t-2xl w-full p-5 flex flex-col gap-3 shadow-xl">
          <h2 className="font-bold text-slate-800 text-base">Editar usuario</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
            placeholder="Nombre"
          />
          {roleSelect('sm')}
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-accent font-mono"
            placeholder="Nuevo código (opcional)"
          />
          <div className="flex gap-3 pt-1">
            <button onClick={() => setEditing(false)} className="flex-1 text-sm text-slate-600 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 text-sm bg-brand text-white px-4 py-2 rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop — inline */}
      <div className="hidden md:flex flex-col gap-2 items-end min-w-48">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-accent"
          placeholder="Nombre"
        />
        {roleSelect('xs')}
        <input
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-accent font-mono"
          placeholder="Nuevo código (opcional)"
        />
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-slate-700">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="text-xs bg-brand text-white px-3 py-1 rounded-lg hover:bg-brand-dark disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  )
}
