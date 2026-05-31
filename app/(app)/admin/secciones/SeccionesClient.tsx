'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, ChevronUp, ChevronDown } from 'lucide-react'
import type { AreaTemplate, ItemTemplate, AppRole } from '@/lib/types'

interface Props {
  areas: AreaTemplate[]
  roles: AppRole[]
  isReadOnly: boolean
}

type AreaWithItems = AreaTemplate & { item_templates: ItemTemplate[] }

export default function SeccionesClient({ areas: initial, roles, isReadOnly }: Props) {
  const [areas, setAreas] = useState<AreaWithItems[]>(
    initial.map((a) => ({ ...a, item_templates: a.item_templates ?? [] })),
  )

  const existingGroups = [...new Set(
    areas.map((a) => a.group_label).filter((g): g is string => !!g),
  )]

  // ── Modal nueva/editar sección ──────────────────────────────
  const [modal, setModal] = useState<{
    open: boolean; areaKey?: string; label: string
    roles: string[]; group: string; groupIsNew: boolean
  }>({ open: false, label: '', roles: [], group: '', groupIsNew: false })
  const [modalSaving, setModalSaving] = useState(false)

  function openNewModal() {
    setModal({ open: true, label: '', roles: [], group: '', groupIsNew: false })
  }

  function openEditModal(area: AreaWithItems) {
    const grp = area.group_label ?? ''
    setModal({
      open: true,
      areaKey: area.area_key,
      label: area.label,
      roles: area.role_access.filter((r) => r !== 'admin' && r !== 'dueno'),
      group: grp,
      groupIsNew: grp !== '' && !existingGroups.includes(grp),
    })
  }

  async function saveModal() {
    if (!modal.label.trim()) return
    setModalSaving(true)
    const roleAccess = [...modal.roles, 'admin', 'dueno']
    const group_label = modal.group.trim() || null
    try {
      if (modal.areaKey) {
        const res = await fetch(`/api/admin/areas/${modal.areaKey}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: modal.label.trim(), role_access: roleAccess, group_label }),
        })
        if (res.ok) {
          const updated = await res.json()
          setAreas((prev) =>
            prev.map((a) => (a.area_key === modal.areaKey ? { ...a, label: updated.label, role_access: updated.role_access, group_label: updated.group_label } : a)),
          )
        }
      } else {
        const res = await fetch('/api/admin/areas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: modal.label.trim(), role_access: roleAccess, group_label }),
        })
        if (res.ok) {
          const created = await res.json()
          setAreas((prev) => [...prev, { ...created, item_templates: [] }])
        }
      }
    } finally {
      setModalSaving(false)
      setModal({ open: false, label: '', roles: [], group: '', groupIsNew: false })
    }
  }

  // ── Eliminar sección ────────────────────────────────────────
  async function deleteArea(areaKey: string) {
    if (!confirm('¿Eliminar esta sección? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/admin/areas/${areaKey}`, { method: 'DELETE' })
    if (res.ok) setAreas((prev) => prev.filter((a) => a.area_key !== areaKey))
  }

  // ── Agregar tarea ───────────────────────────────────────────
  const [newTask, setNewTask] = useState<Record<string, string>>({})

  async function addTask(areaKey: string) {
    const label = (newTask[areaKey] ?? '').trim()
    if (!label) return
    const res = await fetch(`/api/admin/areas/${areaKey}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    })
    if (res.ok) {
      const item: ItemTemplate = await res.json()
      setAreas((prev) =>
        prev.map((a) =>
          a.area_key === areaKey ? { ...a, item_templates: [...a.item_templates, item] } : a,
        ),
      )
      setNewTask((t) => ({ ...t, [areaKey]: '' }))
    }
  }

  // ── Editar tarea inline ─────────────────────────────────────
  const [editingItem, setEditingItem] = useState<{ id: string; label: string } | null>(null)

  async function saveItem() {
    if (!editingItem || !editingItem.label.trim()) return
    const res = await fetch(`/api/admin/items/${editingItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: editingItem.label.trim() }),
    })
    if (res.ok) {
      setAreas((prev) =>
        prev.map((a) => ({
          ...a,
          item_templates: a.item_templates.map((i) =>
            i.id === editingItem.id ? { ...i, label: editingItem.label.trim() } : i,
          ),
        })),
      )
    }
    setEditingItem(null)
  }

  // ── Eliminar tarea ──────────────────────────────────────────
  async function deleteItem(areaKey: string, itemId: string) {
    const res = await fetch(`/api/admin/items/${itemId}`, { method: 'DELETE' })
    if (res.ok) {
      setAreas((prev) =>
        prev.map((a) =>
          a.area_key === areaKey
            ? { ...a, item_templates: a.item_templates.filter((i) => i.id !== itemId) }
            : a,
        ),
      )
    }
  }

  // ── Mover tarea (arriba/abajo) ──────────────────────────────
  async function moveItem(areaKey: string, itemId: string, direction: 'up' | 'down') {
    const area = areas.find((a) => a.area_key === areaKey)
    if (!area) return
    const items = [...area.item_templates]
    const idx = items.findIndex((i) => i.id === itemId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= items.length) return

    const newItems = [...items]
    const tempOrder = newItems[idx].sort_order
    newItems[idx] = { ...newItems[idx], sort_order: newItems[swapIdx].sort_order }
    newItems[swapIdx] = { ...newItems[swapIdx], sort_order: tempOrder }
    newItems.sort((a, b) => a.sort_order - b.sort_order)

    setAreas((prev) =>
      prev.map((a) => (a.area_key === areaKey ? { ...a, item_templates: newItems } : a)),
    )

    await Promise.all([
      fetch(`/api/admin/items/${newItems[idx].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: newItems[idx].sort_order }),
      }),
      fetch(`/api/admin/items/${newItems[swapIdx].id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: newItems[swapIdx].sort_order }),
      }),
    ])
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Secciones</h1>
        {!isReadOnly && (
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-brand text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-brand-dark transition-colors"
          >
            <Plus size={16} strokeWidth={2} />
            Nueva Sección
          </button>
        )}
      </div>

      {/* Lista de secciones */}
      <div className="flex flex-col gap-4">
        {areas.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <p className="text-slate-400">No hay secciones configuradas.</p>
          </div>
        )}

        {areas.map((area) => (
          <div key={area.area_key} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header de sección */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{area.label}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {area.role_access
                    .filter((r) => r !== 'admin' && r !== 'dueno')
                    .map((r) => roles.find((x) => x.role_key === r)?.label ?? r)
                    .join(', ') || 'Sin rol asignado'}
                  {' · '}
                  {area.item_templates.length} tarea{area.item_templates.length !== 1 ? 's' : ''}
                  {!area.is_active && (
                    <span className="ml-2 bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded-full">
                      Inactiva
                    </span>
                  )}
                </p>
              </div>
              {!isReadOnly && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEditModal(area)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Pencil size={12} strokeWidth={2} />
                    Editar
                  </button>
                  <button
                    onClick={() => deleteArea(area.area_key)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>

            {/* Lista de tareas */}
            <div className="px-5 py-3">
              {area.item_templates.length === 0 && (
                <p className="text-xs text-slate-400 py-2">Sin tareas en esta sección.</p>
              )}
              <div className="flex flex-col divide-y divide-slate-50">
                {area.item_templates.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 py-2">
                    <span className="text-xs text-slate-400 w-5 flex-shrink-0 tabular-nums">{idx + 1}.</span>

                    {editingItem?.id === item.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={editingItem.label}
                          onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveItem(); if (e.key === 'Escape') setEditingItem(null) }}
                          className="flex-1 text-sm border border-accent rounded-lg px-2 py-1 focus:outline-none"
                        />
                        <button onClick={saveItem} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
                        <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                      </div>
                    ) : (
                      <span className="flex-1 text-sm text-slate-700 leading-snug">{item.label}</span>
                    )}

                    {!isReadOnly && editingItem?.id !== item.id && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => moveItem(area.area_key, item.id, 'up')}
                          disabled={idx === 0}
                          className="text-slate-300 hover:text-slate-500 disabled:opacity-30"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveItem(area.area_key, item.id, 'down')}
                          disabled={idx === area.item_templates.length - 1}
                          className="text-slate-300 hover:text-slate-500 disabled:opacity-30"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          onClick={() => setEditingItem({ id: item.id, label: item.label })}
                          className="text-slate-400 hover:text-slate-600 ml-1"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteItem(area.area_key, item.id)}
                          className="text-slate-300 hover:text-red-500 ml-0.5"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Agregar tarea */}
              {!isReadOnly && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Nueva tarea..."
                    value={newTask[area.area_key] ?? ''}
                    onChange={(e) => setNewTask((t) => ({ ...t, [area.area_key]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') addTask(area.area_key) }}
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => addTask(area.area_key)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand border border-brand/30 px-3 py-2 rounded-lg hover:bg-brand/5 transition-colors"
                  >
                    <Plus size={14} />
                    Agregar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nueva/Editar sección */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5">
              {modal.areaKey ? 'Editar sección' : 'Nueva sección'}
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1.5">
                  Nombre de la sección
                </label>
                <input
                  autoFocus
                  type="text"
                  value={modal.label}
                  onChange={(e) => setModal((m) => ({ ...m, label: e.target.value }))}
                  placeholder="Ej: Apertura de Bar"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1.5">
                  Grupo <span className="normal-case font-normal text-slate-400">(opcional)</span>
                </label>
                <select
                  value={modal.groupIsNew ? '__nuevo__' : modal.group}
                  onChange={(e) => {
                    if (e.target.value === '__nuevo__') {
                      setModal((m) => ({ ...m, groupIsNew: true, group: '' }))
                    } else {
                      setModal((m) => ({ ...m, groupIsNew: false, group: e.target.value }))
                    }
                  }}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent bg-white"
                >
                  <option value="">Sin grupo</option>
                  {existingGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                  <option value="__nuevo__">+ Crear nuevo grupo...</option>
                </select>
                {modal.groupIsNew && (
                  <input
                    autoFocus
                    type="text"
                    value={modal.group}
                    onChange={(e) => setModal((m) => ({ ...m, group: e.target.value }))}
                    placeholder="Nombre del nuevo grupo"
                    className="w-full mt-2 border border-accent rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  />
                )}
                <p className="text-xs text-slate-400 mt-1">Secciones con el mismo grupo se muestran juntas en el panel.</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-2">
                  Roles con acceso
                </p>
                <div className="flex flex-col gap-2">
                  {roles.map((r) => (
                    <label key={r.role_key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modal.roles.includes(r.role_key)}
                        onChange={(e) =>
                          setModal((m) => ({
                            ...m,
                            roles: e.target.checked
                              ? [...m.roles, r.role_key]
                              : m.roles.filter((x) => x !== r.role_key),
                          }))
                        }
                        className="w-4 h-4 accent-brand"
                      />
                      <span className="text-sm text-slate-700">{r.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">Admin y Dueño siempre tienen acceso.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal({ open: false, label: '', roles: [], group: '', groupIsNew: false })}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveModal}
                disabled={modalSaving || !modal.label.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-brand hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                {modalSaving ? 'Guardando...' : modal.areaKey ? 'Guardar cambios' : 'Crear sección'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
