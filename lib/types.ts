export type Role = string

export interface AppRole {
  id: string
  role_key: string
  label: string
  is_system: boolean
  created_at: string
}

export interface SessionPayload {
  userId: string
  role: Role
  name: string
}

export interface User {
  id: string
  name: string
  role: Role
  access_code: string
  code_display: string
  is_active: boolean
  created_at: string
}

export interface Checklist {
  id: string
  area_id: string
  user_id: string
  date: string
  status: 'in_progress' | 'completed'
  completed_at: string | null
  created_at: string
  checklist_items?: ChecklistItem[]
  users?: { name: string }
}

export interface ChecklistItem {
  id: string
  checklist_id: string
  item_key: string
  label: string
  is_completed: boolean
  note: string | null
  completed_at: string | null
  completed_by: string | null
}

export interface CashCloseDetails {
  id: string
  checklist_id: string
  denom_1000: number
  denom_500: number
  denom_200: number
  denom_100: number
  denom_50: number
  denom_20: number
  denom_10: number
  denom_5: number
  denom_1: number
  total_counted: number
  fund_amount: number
  sales_amount: number
  digital_signature: string
}

export interface ChecklistDefinitionItem {
  item_key: string
  label: string
}

export interface AreaTemplate {
  id: string
  area_key: string
  label: string
  role_access: string[]
  sort_order: number
  is_active: boolean
  group_label: string | null
  created_at: string
  item_templates?: ItemTemplate[]
}

export interface ItemTemplate {
  id: string
  area_key: string
  label: string
  sort_order: number
  created_at: string
}
