'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, ClipboardList, Settings2, ShieldCheck } from 'lucide-react'

const links = [
  { href: '/admin', label: 'Panel', icon: LayoutDashboard, exact: true },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/historial', label: 'Historial', icon: ClipboardList },
  { href: '/admin/secciones', label: 'Secciones', icon: Settings2 },
  { href: '/admin/roles', label: 'Roles', icon: ShieldCheck },
]

export function SidebarNav() {
  const pathname = usePathname()
  return (
    <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs uppercase tracking-widest font-semibold transition-colors ${
              active
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={16} strokeWidth={active ? 2.5 : 1.5} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand flex border-t border-white/10">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs uppercase tracking-widest font-semibold transition-colors ${
              active ? 'text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.5} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
