import type { Reservation, ReservationStatus } from '../../domain/entities/Reservation'
import type { VariantId } from '../../domain/value-objects/VariantId'

export interface ReservationRepo {
  getById(companyId: string, id: string): Promise<Reservation | null>
  create(reservation: Reservation): Promise<void>
  updateStatus(companyId: string, id: string, status: ReservationStatus): Promise<void>
  listActiveQtyByVariant(companyId: string, variantId: VariantId): Promise<number>
}
