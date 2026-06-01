import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import LogoutButton from '@/app/(app)/_components/LogoutButton'
import { SidebarNav, BottomNav } from './_components/NavLinks'
import AvatarMenu from './_components/AvatarMenu'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin' && session.role !== 'dueno') redirect('/dashboard')

  return (
    <div className="min-h-screen flex">
      {/* Sidebar rojo — desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-brand fixed h-full">
        <div className="px-6 py-7 border-b border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_transparente.png" alt="Innamoratti" style={{ width: '130px', height: 'auto' }} />
        </div>

        <SidebarNav />

        <div className="px-6 py-5 border-t border-white/10">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-2">{session.name}</p>
          <LogoutButton />
        </div>
      </aside>

      {/* Header rojo — mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-brand z-40 h-14 flex items-center justify-between px-5">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_transparente.png" alt="Innamoratti" style={{ height: '32px', width: 'auto' }} />
        </div>
        <AvatarMenu name={session.name} />
      </header>

      {/* Contenido principal */}
      <div className="flex-1 md:ml-56 bg-slate-50 min-h-screen pt-14 md:pt-0 pb-16 md:pb-0">
        {children}
      </div>

      {/* Bottom nav — mobile */}
      <BottomNav />
    </div>
  )
}
