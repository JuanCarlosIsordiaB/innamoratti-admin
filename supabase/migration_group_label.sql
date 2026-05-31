-- Añadir columna group_label a area_templates (si ya existe la tabla)
ALTER TABLE area_templates ADD COLUMN IF NOT EXISTS group_label text;

-- Actualizar áreas existentes con sus grupos
UPDATE area_templates SET group_label = 'Salón'  WHERE area_key IN ('salon_apertura', 'salon_cierre');
UPDATE area_templates SET group_label = 'Cocina' WHERE area_key IN ('cocina_apertura', 'cocina_cierre');
UPDATE area_templates SET group_label = 'Caja'   WHERE area_key IN ('caja_apertura', 'caja_cierre');
