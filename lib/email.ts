import { Resend } from 'resend'
import { supabase } from './supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function getNotificationEmail(): Promise<string | null> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'notification_email')
    .single()
  return data?.value ?? null
}

export async function sendSectionCompletedEmail(params: {
  areaLabel: string
  userName: string
  completedAt: string
}) {
  const to = await getNotificationEmail()
  if (!to || !process.env.RESEND_API_KEY) return

  const time = new Date(params.completedAt).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Mexico_City',
  })
  const date = new Date(params.completedAt).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Mexico_City',
  })

  await resend.emails.send({
    from: 'Innamoratti Control <onboarding@resend.dev>',
    to,
    subject: `✅ ${params.areaLabel} completada al 100%`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; border-radius: 12px;">
        <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 20px;">Sección completada</h2>
        <p style="margin: 0 0 24px; color: #64748b; font-size: 14px;">${date}</p>

        <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 12px; font-size: 14px; color: #64748b;">Área</p>
          <p style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #1e293b;">${params.areaLabel}</p>

          <p style="margin: 0 0 4px; font-size: 14px; color: #64748b;">Completada por</p>
          <p style="margin: 0 0 20px; font-size: 15px; font-weight: 600; color: #1e293b;">${params.userName}</p>

          <p style="margin: 0 0 4px; font-size: 14px; color: #64748b;">Hora de finalización</p>
          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #16a34a;">${time}</p>
        </div>

        <p style="margin: 24px 0 0; font-size: 12px; color: #94a3b8; text-align: center;">Innamoratti Control — Notificaciones automáticas</p>
      </div>
    `,
  })
}
