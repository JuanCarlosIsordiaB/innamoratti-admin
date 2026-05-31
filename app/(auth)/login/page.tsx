'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successDest, setSuccessDest] = useState('')

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => router.push(successDest), 5000)
    return () => clearTimeout(t)
  }, [success, successDest, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Código incorrecto')
        setLoading(false)
        return
      }

      const dest = (data.role === 'admin' || data.role === 'dueno') ? '/admin' : '/dashboard'
      setSuccessDest(dest)
      setSuccess(true)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <>
      {success && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: '#7a110d',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_transparente.png"
            alt="Innamoratti"
            style={{ width: '240px', height: 'auto', animation: 'login-success-spin 1.2s linear infinite' }}
          />
        </div>
      )}

      <main className="min-h-screen bg-brand flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_transparente.png"
            alt="Innamoratti"
            style={{ width: '220px', height: 'auto' }}
          />
        </div>

        {/* Card */}
        <div className="w-full max-w-xs bg-white rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="code" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Código de acceso
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="482193"
                autoComplete="off"
                autoFocus
                className="w-full text-4xl font-mono tracking-[0.2em] text-center border-2 border-slate-100 rounded-xl px-4 py-4 text-slate-800 focus:outline-none focus:border-brand transition-colors bg-slate-50"
              />
            </div>

            {error && (
              <p className="text-brand text-sm text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-brand hover:bg-brand-dark disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold uppercase tracking-widest text-sm py-4 rounded-xl transition-colors"
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
