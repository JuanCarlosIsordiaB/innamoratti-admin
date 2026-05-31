'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateAccessCode } from '@/lib/code-generator'
import type { AppRole } from '@/lib/types'

export default function NuevoUsuarioForm({ roles }: { roles: AppRole[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [role, setRole] = useState(roles.find((r) => !r.is_system)?.role_key ?? roles[0]?.role_key ?? '')
  const [customCode, setCustomCode] = useState('')
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setSaving(true)

    const code = customCode.trim() || generateAccessCode()

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), role, code }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al crear usuario')
      setSaving(false)
      return
    }

    setCreatedCode(data.code_display)
    setSaving(false)
  }

  async function copyCode() {
    if (!createdCode) return
    await navigator.clipboard.writeText(createdCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (createdCode) {
    return (
      <div className="p-4 md:p-8 max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-green-200 p-8 text-center shadow-sm">
          <div className="text-4xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Usuario creado</h2>
          <p className="text-slate-500 text-sm mb-6">Comparte este código con el empleado. Solo se muestra una vez.</p>
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <p className="text-3xl font-mono font-bold tracking-widest text-slate-800">{createdCode}</p>
          </div>
          <button onClick={copyCode} className="w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-colors mb-3">
            {copied ? '¡Copiado!' : 'Copiar código'}
          </button>
          <button onClick={() => router.push('/admin/usuarios')} className="w-full text-slate-500 hover:text-slate-700 text-sm py-2">
            Volver a la lista
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 text-xl">←</button>
        <h1 className="text-2xl font-bold text-slate-800">Nuevo empleado</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ej: Roberto García"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm"
          >
            {roles.map((r) => (
              <option key={r.role_key} value={r.role_key}>{r.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Código personalizado <span className="text-slate-400 font-normal">(opcional — se genera automáticamente)</span>
          </label>
          <input
            type="text"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            placeholder={`Ej: ${generateAccessCode()}`}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent text-sm font-mono"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full bg-brand hover:bg-brand-dark disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-4 rounded-xl text-sm transition-colors"
        >
          {saving ? 'Creando...' : 'Crear empleado'}
        </button>
      </form>
    </div>
  )
}
