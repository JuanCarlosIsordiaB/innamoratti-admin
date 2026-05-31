'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className={className ?? 'text-xs text-white/50 hover:text-white transition-colors uppercase tracking-widest'}
    >
      Salir
    </button>
  )
}
