'use client'

import { useState } from 'react'
import { Mail, Save, CheckCircle2 } from 'lucide-react'

export default function ConfiguracionClient({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    setSaved(false)
    setSaving(true)

    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_email: email || null }),
    })

    setSaving(false)

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError('No se pudo guardar. Intenta de nuevo.')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <Mail size={16} className="text-brand" strokeWidth={2} />
        <h2 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Notificaciones por correo</h2>
      </div>
      <p className="text-xs text-slate-400 mb-5 ml-6">
        Cuando una sección se complete al 100%, se enviará un correo a esta dirección.
      </p>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
          Correo del administrador
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@ejemplo.com"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
        />

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-brand/90 transition-colors disabled:opacity-60"
          >
            <Save size={14} strokeWidth={2} />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
              <CheckCircle2 size={14} strokeWidth={2} />
              Guardado
            </span>
          )}
        </div>

        {!email && (
          <p className="text-xs text-slate-400 mt-1">
            Si dejas el campo vacío, las notificaciones quedarán desactivadas.
          </p>
        )}
      </div>
    </div>
  )
}
