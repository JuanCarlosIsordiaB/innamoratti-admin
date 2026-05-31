-- Innamoratti — Migración: Gestión dinámica de secciones y tareas
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE area_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_key    text UNIQUE NOT NULL,
  label       text NOT NULL,
  role_access text[] NOT NULL DEFAULT '{}',
  sort_order  int NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  group_label text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE item_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_key    text NOT NULL REFERENCES area_templates(area_key) ON DELETE CASCADE ON UPDATE CASCADE,
  label       text NOT NULL,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX item_templates_area_key_idx ON item_templates(area_key);

-- Seed áreas existentes
INSERT INTO area_templates (area_key, label, role_access, sort_order, group_label) VALUES
  ('salon_apertura',  'Apertura de Salón',              '{"mesero","admin","dueno"}',   1, 'Salón'),
  ('salon_cierre',    'Cierre de Salón',                '{"mesero","admin","dueno"}',   2, 'Salón'),
  ('cocina_apertura', 'Apertura de Cocina',             '{"cocinero","admin","dueno"}', 3, 'Cocina'),
  ('cocina_cierre',   'Cierre de Cocina',               '{"cocinero","admin","dueno"}', 4, 'Cocina'),
  ('caja_apertura',   'Apertura de Caja',               '{"cajero","admin","dueno"}',   5, 'Caja'),
  ('caja_cierre',     'Cierre de Caja (Corte Maestro)', '{"cajero","admin","dueno"}',   6, 'Caja');

-- Seed tareas existentes
INSERT INTO item_templates (area_key, label, sort_order) VALUES
  ('salon_apertura', 'Preparar el espacio físico del salón', 1),
  ('salon_apertura', 'Sacar y acomodar mobiliario exterior (mesas y sillas de terraza)', 2),
  ('salon_apertura', 'Barrer y fregar el piso del salón', 3),
  ('salon_apertura', 'Equipar mesas: manteles, servilletas, saleros y salsas', 4),
  ('salon_apertura', 'Verificar limpieza de cristales y ventanas', 5),
  ('salon_apertura', 'Apertura oficial: desactivar alarma y abrir puertas', 6),
  ('salon_cierre', 'Desmontar mesas: guardar manteles y servilletas', 1),
  ('salon_cierre', 'Limpiar barra y zona de bebidas', 2),
  ('salon_cierre', 'Barrer y fregar el piso del salón', 3),
  ('salon_cierre', 'Guardar mobiliario exterior (mesas y sillas de terraza)', 4),
  ('salon_cierre', 'Verificar y limpiar baños', 5),
  ('salon_cierre', 'Cierre del local: activar alarma y cerrar puertas', 6),
  ('cocina_apertura', 'Revisar limpieza general de la cocina del día anterior', 1),
  ('cocina_apertura', 'Revisar existencias e inventario básico', 2),
  ('cocina_apertura', 'Limpiar y encender equipos: freidoras, planchas y hornos', 3),
  ('cocina_apertura', 'Montar barra con ingredientes preparados', 4),
  ('cocina_apertura', 'Preparar y acomodar insumos y utensilios', 5),
  ('cocina_apertura', 'Verificar mise en place completo para el servicio', 6),
  ('cocina_cierre', 'Apagar y limpiar equipos: freidoras, planchas y hornos', 1),
  ('cocina_cierre', 'Limpiar superficies y mesas de trabajo', 2),
  ('cocina_cierre', 'Acomodar y guardar utensilios', 3),
  ('cocina_cierre', 'Cubrir y refrigerar insumos', 4),
  ('cocina_cierre', 'Barrer y fregar el piso de la cocina', 5),
  ('cocina_cierre', 'Verificar gas, agua y electricidad apagados', 6),
  ('caja_apertura', 'Recibir y contar fondo de caja ($1,500)', 1),
  ('caja_apertura', 'Verificar sistema POS encendido y funcionando', 2),
  ('caja_apertura', 'Verificar impresora de tickets', 3),
  ('caja_apertura', 'Verificar datafono y terminales de pago', 4),
  ('caja_apertura', 'Verificar disponibilidad de todos los métodos de pago', 5),
  ('caja_apertura', 'Registro de apertura en el sistema', 6),
  ('caja_cierre', 'Preparar documentación para el corte de caja', 1),
  ('caja_cierre', 'Contar dinero por denominaciones (usar calculadora)', 2),
  ('caja_cierre', 'Verificar que el total cuadre con las ventas del día', 3),
  ('caja_cierre', 'Entregar fondo ($1,500) y ventas al encargado', 4),
  ('caja_cierre', 'Cerrar sistema POS y registro de cierre', 5),
  ('caja_cierre', 'Verificación final del local antes de salir', 6);
