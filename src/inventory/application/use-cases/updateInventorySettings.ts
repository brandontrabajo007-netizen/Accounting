import type { InventorySettingsRepo } from '../ports/InventorySettingsRepo'
import type { MovementRepo } from '../ports/MovementRepo'
import type { ReservationRepo } from '../ports/ReservationRepo'
import type { VariantRepo } from '../ports/VariantRepo'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import type { InventoryMode } from '../../domain/entities/InventorySettings'
import { resolveInventoryMode } from '../services/resolveInventoryMode'

export type UpdateInventorySettingsCommand = Readonly<{
  companyId: string
  mode: InventoryMode
}>

export type UpdateInventorySettingsError = Readonly<{
  type: 'InventoryModeChangeNotAllowed'
  reason: 'HAS_MOVEMENTS' | 'HAS_RESERVATIONS' | 'HAS_USER_VARIANTS'
}>

export type UpdateInventorySettingsResult = Readonly<{
  mode: InventoryMode
}>

export function makeUpdateInventorySettings(
  deps: Readonly<{
    inventorySettingsRepo: InventorySettingsRepo
    movementRepo: MovementRepo
    reservationRepo: ReservationRepo
    variantRepo: VariantRepo
  }>,
) {
  return async function updateInventorySettings(
    command: UpdateInventorySettingsCommand,
  ): Promise<ResultType<UpdateInventorySettingsResult, UpdateInventorySettingsError>> {
    const currentMode = await resolveInventoryMode(deps.inventorySettingsRepo, command.companyId)
    if (currentMode === command.mode) {
      return Result.ok({ mode: currentMode })
    }

    if (command.mode === 'SIMPLE') {
      const [hasMovements, hasReservations, hasUserVariants] = await Promise.all([
        deps.movementRepo.existsForActiveProductsByCompany(command.companyId),
        deps.reservationRepo.existsByCompany(command.companyId),
        deps.variantRepo.existsUserManagedByCompany(command.companyId),
      ])

      if (hasMovements) {
        return Result.err({ type: 'InventoryModeChangeNotAllowed', reason: 'HAS_MOVEMENTS' })
      }
      if (hasReservations) {
        return Result.err({ type: 'InventoryModeChangeNotAllowed', reason: 'HAS_RESERVATIONS' })
      }
      if (hasUserVariants) {
        return Result.err({ type: 'InventoryModeChangeNotAllowed', reason: 'HAS_USER_VARIANTS' })
      }
    }

    const updated = await deps.inventorySettingsRepo.upsertMode(command.companyId, command.mode)
    return Result.ok({ mode: updated.mode })
  }
}
