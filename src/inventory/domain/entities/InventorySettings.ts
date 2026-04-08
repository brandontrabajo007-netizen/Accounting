export type InventoryMode = 'SIMPLE' | 'VARIANT'

export type InventorySettings = Readonly<{
  companyId: string
  mode: InventoryMode
  createdAt: Date
  updatedAt: Date
}>

export const DEFAULT_INVENTORY_MODE: InventoryMode = 'VARIANT'
