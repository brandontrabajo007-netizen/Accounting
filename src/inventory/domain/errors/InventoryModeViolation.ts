import type { InventoryMode } from '../entities/InventorySettings'

export type InventoryModeViolation = Readonly<{
  type: 'InventoryModeViolation'
  mode: InventoryMode
  operation:
    | 'VARIANT_MANAGEMENT'
    | 'VARIANT_REQUIRED'
    | 'VARIANT_DISALLOWED'
    | 'MODE_SWITCH_TO_SIMPLE_BLOCKED'
}>
