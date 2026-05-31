import type { ChecklistDefinitionItem, Role } from '@/lib/types'

export const CHECKLIST_DEFINITIONS: Record<string, ChecklistDefinitionItem[]> = {
  salon_apertura: [
    { item_key: 'preparar_espacio', label: 'Preparar el espacio físico del salón' },
    { item_key: 'mobiliario_exterior', label: 'Sacar y acomodar mobiliario exterior (mesas y sillas de terraza)' },
    { item_key: 'limpiar_pisos', label: 'Barrer y fregar el piso del salón' },
    { item_key: 'equipar_mesas', label: 'Equipar mesas: manteles, servilletas, saleros y salsas' },
    { item_key: 'verificar_cristales', label: 'Verificar limpieza de cristales y ventanas' },
    { item_key: 'apertura_oficial', label: 'Apertura oficial: desactivar alarma y abrir puertas' },
  ],
  salon_cierre: [
    { item_key: 'desmontar_mesas', label: 'Desmontar mesas: guardar manteles y servilletas' },
    { item_key: 'limpiar_barra', label: 'Limpiar barra y zona de bebidas' },
    { item_key: 'limpiar_piso_cierre', label: 'Barrer y fregar el piso del salón' },
    { item_key: 'guardar_mobiliario', label: 'Guardar mobiliario exterior (mesas y sillas de terraza)' },
    { item_key: 'verificar_banos', label: 'Verificar y limpiar baños' },
    { item_key: 'cierre_local', label: 'Cierre del local: activar alarma y cerrar puertas' },
  ],
  cocina_apertura: [
    { item_key: 'revisar_limpieza', label: 'Revisar limpieza general de la cocina del día anterior' },
    { item_key: 'revisar_existencias', label: 'Revisar existencias e inventario básico' },
    { item_key: 'limpiar_encender_equipos', label: 'Limpiar y encender equipos: freidoras, planchas y hornos' },
    { item_key: 'montar_ingredientes', label: 'Montar barra con ingredientes preparados' },
    { item_key: 'preparar_insumos', label: 'Preparar y acomodar insumos y utensilios' },
    { item_key: 'mise_en_place', label: 'Verificar mise en place completo para el servicio' },
  ],
  cocina_cierre: [
    { item_key: 'apagar_limpiar_equipos', label: 'Apagar y limpiar equipos: freidoras, planchas y hornos' },
    { item_key: 'limpiar_superficies', label: 'Limpiar superficies y mesas de trabajo' },
    { item_key: 'acomodar_utensilios', label: 'Acomodar y guardar utensilios' },
    { item_key: 'cubrir_insumos', label: 'Cubrir y refrigerar insumos' },
    { item_key: 'limpiar_piso_cocina', label: 'Barrer y fregar el piso de la cocina' },
    { item_key: 'verificar_gas_agua', label: 'Verificar gas, agua y electricidad apagados' },
  ],
  caja_apertura: [
    { item_key: 'recibir_fondo', label: 'Recibir y contar fondo de caja ($1,500)' },
    { item_key: 'verificar_pos', label: 'Verificar sistema POS encendido y funcionando' },
    { item_key: 'verificar_impresora', label: 'Verificar impresora de tickets' },
    { item_key: 'verificar_datafono', label: 'Verificar datafono y terminales de pago' },
    { item_key: 'verificar_metodos_pago', label: 'Verificar disponibilidad de todos los métodos de pago' },
    { item_key: 'apertura_sistema', label: 'Registro de apertura en el sistema' },
  ],
  caja_cierre: [
    { item_key: 'preparar_documentacion', label: 'Preparar documentación para el corte de caja' },
    { item_key: 'contar_denominaciones', label: 'Contar dinero por denominaciones (usar calculadora)' },
    { item_key: 'verificar_cuadre', label: 'Verificar que el total cuadre con las ventas del día' },
    { item_key: 'entregar_fondo_ventas', label: 'Entregar fondo ($1,500) y ventas al encargado' },
    { item_key: 'cerrar_sistema_pos', label: 'Cerrar sistema POS y registro de cierre' },
    { item_key: 'verificacion_final', label: 'Verificación final del local antes de salir' },
  ],
}

export const AREA_LABELS: Record<string, string> = {
  salon_apertura: 'Apertura de Salón',
  salon_cierre: 'Cierre de Salón',
  cocina_apertura: 'Apertura de Cocina',
  cocina_cierre: 'Cierre de Cocina',
  caja_apertura: 'Apertura de Caja',
  caja_cierre: 'Cierre de Caja (Corte Maestro)',
}

export const ROLE_AREAS: Record<Role, string[]> = {
  mesero: ['salon_apertura', 'salon_cierre'],
  cocinero: ['cocina_apertura', 'cocina_cierre'],
  cajero: ['caja_apertura', 'caja_cierre'],
  admin: ['salon_apertura', 'salon_cierre', 'cocina_apertura', 'cocina_cierre', 'caja_apertura', 'caja_cierre'],
  dueno: ['salon_apertura', 'salon_cierre', 'cocina_apertura', 'cocina_cierre', 'caja_apertura', 'caja_cierre'],
}

export const AREA_GROUPS = [
  {
    key: 'salon',
    label: 'Salón',
    apertura: 'salon_apertura',
    cierre: 'salon_cierre',
  },
  {
    key: 'cocina',
    label: 'Cocina',
    apertura: 'cocina_apertura',
    cierre: 'cocina_cierre',
  },
  {
    key: 'caja',
    label: 'Caja',
    apertura: 'caja_apertura',
    cierre: 'caja_cierre',
  },
]
