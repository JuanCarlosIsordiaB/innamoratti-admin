-- Innamoratti — Migración: Roles dinámicos
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key   text UNIQUE NOT NULL,
  label      text NOT NULL,
  is_system  boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

INSERT INTO roles (role_key, label, is_system) VALUES
  ('admin',    'Administrador', true),
  ('dueno',    'Dueño',         true),
  ('mesero',   'Mesero',        false),
  ('cocinero', 'Cocinero',      false),
  ('cajero',   'Cajero',        false);

-- Remover CHECK constraint hardcodeado
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Integridad referencial
ALTER TABLE users
  ADD CONSTRAINT users_role_fkey
  FOREIGN KEY (role) REFERENCES roles(role_key);
