-- Tabla de configuración general de la aplicación
-- Ejecutar en el SQL Editor de Supabase

create table if not exists app_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);

-- Valor inicial para el correo de notificaciones
insert into app_settings (key, value)
values ('notification_email', null)
on conflict (key) do nothing;
