'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function AvatarMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-slate-200 w-52 py-2 z-50">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">Sesión</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
