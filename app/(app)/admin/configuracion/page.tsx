import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ConfiguracionClient from './ConfiguracionClient'

export default async function ConfiguracionPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin' && session.role !== 'dueno') redirect('/dashboard')

  const { data } = await supabase
    .from('app_settings')
    .select('key, value')

  const settings: Record<string, string | null> = {}
  for (const row of data ?? []) {
    settings[row.key] = row.value
  }

  return (
    <div className="p-5 md:p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-slate-400 uppercase tracking-widest text-xs font-light">Sistema</p>
        <h1 className="text-3xl font-bold text-slate-800 uppercase mt-0.5">Configuración</h1>
      </div>

      <ConfiguracionClient initialEmail={settings['notification_email'] ?? ''} />
    </div>
  )
}
