import { supabase } from './supabase'
import type { AreaTemplate, ItemTemplate } from './types'

// ── Datos hardcodeados como fuente de verdad para el seed ──────────────────
const SEED_AREAS = [
  { area_key: 'salon_apertura',  label: 'Apertura de Salón',              role_access: ['mesero','admin','dueno'],   sort_order: 1, group_label: 'Salón'  },
  { area_key: 'salon_cierre',    label: 'Cierre de Salón',                role_access: ['mesero','admin','dueno'],   sort_order: 2, group_label: 'Salón'  },
  { area_key: 'cocina_apertura', label: 'Apertura de Cocina',             role_access: ['cocinero','admin','dueno'], sort_order: 3, group_label: 'Cocina' },
  { area_key: 'cocina_cierre',   label: 'Cierre de Cocina',               role_access: ['cocinero','admin','dueno'], sort_order: 4, group_label: 'Cocina' },
  { area_key: 'caja_apertura',   label: 'Apertura de Caja',               role_access: ['cajero','admin','dueno'],   sort_order: 5, group_label: 'Caja'   },
  { area_key: 'caja_cierre',     label: 'Cierre de Caja (Corte Maestro)', role_access: ['cajero','admin','dueno'],   sort_order: 6, group_label: 'Caja'   },
]

const SEED_ITEMS: { area_key: string; label: string; sort_order: number }[] = [
  { area_key: 'salon_apertura', label: 'Preparar el espacio físico del salón', sort_order: 1 },
  { area_key: 'salon_apertura', label: 'Sacar y acomodar mobiliario exterior (mesas y sillas de terraza)', sort_order: 2 },
  { area_key: 'salon_apertura', label: 'Barrer y fregar el piso del salón', sort_order: 3 },
  { area_key: 'salon_apertura', label: 'Equipar mesas: manteles, servilletas, saleros y salsas', sort_order: 4 },
  { area_key: 'salon_apertura', label: 'Verificar limpieza de cristales y ventanas', sort_order: 5 },
  { area_key: 'salon_apertura', label: 'Apertura oficial: desactivar alarma y abrir puertas', sort_order: 6 },
  { area_key: 'salon_cierre', label: 'Desmontar mesas: guardar manteles y servilletas', sort_order: 1 },
  { area_key: 'salon_cierre', label: 'Limpiar barra y zona de bebidas', sort_order: 2 },
  { area_key: 'salon_cierre', label: 'Barrer y fregar el piso del salón', sort_order: 3 },
  { area_key: 'salon_cierre', label: 'Guardar mobiliario exterior (mesas y sillas de terraza)', sort_order: 4 },
  { area_key: 'salon_cierre', label: 'Verificar y limpiar baños', sort_order: 5 },
  { area_key: 'salon_cierre', label: 'Cierre del local: activar alarma y cerrar puertas', sort_order: 6 },
  { area_key: 'cocina_apertura', label: 'Revisar limpieza general de la cocina del día anterior', sort_order: 1 },
  { area_key: 'cocina_apertura', label: 'Revisar existencias e inventario básico', sort_order: 2 },
  { area_key: 'cocina_apertura', label: 'Limpiar y encender equipos: freidoras, planchas y hornos', sort_order: 3 },
  { area_key: 'cocina_apertura', label: 'Montar barra con ingredientes preparados', sort_order: 4 },
  { area_key: 'cocina_apertura', label: 'Preparar y acomodar insumos y utensilios', sort_order: 5 },
  { area_key: 'cocina_apertura', label: 'Verificar mise en place completo para el servicio', sort_order: 6 },
  { area_key: 'cocina_cierre', label: 'Apagar y limpiar equipos: freidoras, planchas y hornos', sort_order: 1 },
  { area_key: 'cocina_cierre', label: 'Limpiar superficies y mesas de trabajo', sort_order: 2 },
  { area_key: 'cocina_cierre', label: 'Acomodar y guardar utensilios', sort_order: 3 },
  { area_key: 'cocina_cierre', label: 'Cubrir y refrigerar insumos', sort_order: 4 },
  { area_key: 'cocina_cierre', label: 'Barrer y fregar el piso de la cocina', sort_order: 5 },
  { area_key: 'cocina_cierre', label: 'Verificar gas, agua y electricidad apagados', sort_order: 6 },
  { area_key: 'caja_apertura', label: 'Recibir y contar fondo de caja ($1,500)', sort_order: 1 },
  { area_key: 'caja_apertura', label: 'Verificar sistema POS encendido y funcionando', sort_order: 2 },
  { area_key: 'caja_apertura', label: 'Verificar impresora de tickets', sort_order: 3 },
  { area_key: 'caja_apertura', label: 'Verificar datafono y terminales de pago', sort_order: 4 },
  { area_key: 'caja_apertura', label: 'Verificar disponibilidad de todos los métodos de pago', sort_order: 5 },
  { area_key: 'caja_apertura', label: 'Registro de apertura en el sistema', sort_order: 6 },
  { area_key: 'caja_cierre', label: 'Preparar documentación para el corte de caja', sort_order: 1 },
  { area_key: 'caja_cierre', label: 'Contar dinero por denominaciones (usar calculadora)', sort_order: 2 },
  { area_key: 'caja_cierre', label: 'Verificar que el total cuadre con las ventas del día', sort_order: 3 },
  { area_key: 'caja_cierre', label: 'Entregar fondo ($1,500) y ventas al encargado', sort_order: 4 },
  { area_key: 'caja_cierre', label: 'Cerrar sistema POS y registro de cierre', sort_order: 5 },
  { area_key: 'caja_cierre', label: 'Verificación final del local antes de salir', sort_order: 6 },
]

// ── Seed inicial si la tabla existe pero está vacía ────────────────────────
async function seedDefaultAreas(): Promise<void> {
  await supabase.from('area_templates').insert(SEED_AREAS)
  await supabase.from('item_templates').insert(SEED_ITEMS)
}

// ── Fallback en memoria cuando las tablas no existen ──────────────────────
function buildFallbackAreas(): AreaTemplate[] {
  return SEED_AREAS.map((a) => ({
    ...a,
    id: a.area_key,
    is_active: true,
    group_label: a.group_label ?? null,
    created_at: new Date().toISOString(),
    item_templates: SEED_ITEMS.filter((i) => i.area_key === a.area_key).map((i) => ({
      ...i,
      id: `${a.area_key}_${i.sort_order}`,
      created_at: new Date().toISOString(),
    })),
  }))
}

function formatAreas(data: AreaTemplate[]): AreaTemplate[] {
  return data.map((a) => ({
    ...a,
    item_templates: ((a.item_templates ?? []) as ItemTemplate[]).sort(
      (x, y) => x.sort_order - y.sort_order,
    ),
  }))
}

// ── Funciones públicas ─────────────────────────────────────────────────────

export async function getActiveAreas(): Promise<AreaTemplate[]> {
  const { data, error } = await supabase
    .from('area_templates')
    .select('*, item_templates(id, label, sort_order, area_key, created_at)')
    .eq('is_active', true)
    .order('sort_order')

  if (error) return buildFallbackAreas().filter((a) => a.is_active)

  if (!data || data.length === 0) {
    await seedDefaultAreas()
    const { data: seeded } = await supabase
      .from('area_templates')
      .select('*, item_templates(id, label, sort_order, area_key, created_at)')
      .eq('is_active', true)
      .order('sort_order')
    return formatAreas(seeded ?? buildFallbackAreas())
  }

  return formatAreas(data)
}

export async function getAllAreas(): Promise<AreaTemplate[]> {
  const { data, error } = await supabase
    .from('area_templates')
    .select('*, item_templates(id, label, sort_order, area_key, created_at)')
    .order('sort_order')

  if (error) return buildFallbackAreas()

  if (!data || data.length === 0) {
    await seedDefaultAreas()
    const { data: seeded } = await supabase
      .from('area_templates')
      .select('*, item_templates(id, label, sort_order, area_key, created_at)')
      .order('sort_order')
    return formatAreas(seeded ?? buildFallbackAreas())
  }

  return formatAreas(data)
}

export async function getAreaKeysByRole(role: string): Promise<string[]> {
  let query = supabase
    .from('area_templates')
    .select('area_key')
    .eq('is_active', true)
    .order('sort_order')

  if (role !== 'admin' && role !== 'dueno') {
    query = query.contains('role_access', [role])
  }

  const { data, error } = await query
  if (error || !data || data.length === 0) {
    const fallback = buildFallbackAreas()
    if (role === 'admin' || role === 'dueno') return fallback.map((a) => a.area_key)
    return fallback.filter((a) => a.role_access.includes(role)).map((a) => a.area_key)
  }
  return data.map((a) => a.area_key)
}

export async function getAreaLabelsMap(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('area_templates').select('area_key, label')
  if (error || !data || data.length === 0) {
    return Object.fromEntries(buildFallbackAreas().map((a) => [a.area_key, a.label]))
  }
  return Object.fromEntries(data.map((a) => [a.area_key, a.label]))
}

export async function getItemTemplatesByArea(areaKey: string): Promise<ItemTemplate[]> {
  const { data, error } = await supabase
    .from('item_templates')
    .select('*')
    .eq('area_key', areaKey)
    .order('sort_order')

  if (error || !data || data.length === 0) {
    return SEED_ITEMS.filter((i) => i.area_key === areaKey).map((i) => ({
      ...i,
      id: `${areaKey}_${i.sort_order}`,
      created_at: new Date().toISOString(),
    }))
  }
  return data
}

export async function getAreaForRole(
  areaKey: string,
  role: string,
): Promise<AreaTemplate | null> {
  let query = supabase
    .from('area_templates')
    .select('*')
    .eq('area_key', areaKey)
    .eq('is_active', true)

  if (role !== 'admin' && role !== 'dueno') {
    query = query.contains('role_access', [role])
  }

  const { data, error } = await query.maybeSingle()
  if (error || !data) {
    const fallback = buildFallbackAreas().find((a) => a.area_key === areaKey)
    if (!fallback) return null
    if (role === 'admin' || role === 'dueno') return fallback
    return fallback.role_access.includes(role) ? fallback : null
  }
  return data
}
