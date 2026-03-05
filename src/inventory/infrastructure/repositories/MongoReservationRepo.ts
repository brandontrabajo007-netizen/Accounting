import type { ReservationRepo } from '../../application/ports/ReservationRepo'
import { ReservationModel } from '../db/mongo/models/ReservationModel'
import type { Reservation, ReservationStatus } from '../../domain/entities/Reservation'
import { ProductId } from '../../domain/value-objects/ProductId'
import { Quantity } from '../../domain/value-objects/Quantity'
import { VariantId } from '../../domain/value-objects/VariantId'

export class MongoReservationRepo implements ReservationRepo {
  async getById(companyId: string, id: string): Promise<Reservation | null> {
    const doc = await ReservationModel.findOne({ _id: id, companyId }).lean().exec()
    if (!doc) return null

    return {
      id: doc._id,
      companyId: doc.companyId,
      items: doc.items.map((item) => ({
        productId: ProductId.from(item.productId),
        variantId: VariantId.from(item.variantId),
        qty: Quantity.from(item.qty),
      })),
      status: doc.status,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  }

  async create(reservation: Reservation): Promise<void> {
    await ReservationModel.create({
      _id: reservation.id,
      companyId: reservation.companyId,
      items: reservation.items,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    })
  }

  async updateStatus(companyId: string, id: string, status: ReservationStatus): Promise<void> {
    await ReservationModel.updateOne({ _id: id, companyId }, { $set: { status, updatedAt: new Date() } })
  }

  async listActiveQtyByVariant(companyId: string, variantId: VariantId): Promise<number> {
    const now = new Date()
    const docs = await ReservationModel.find({
      companyId,
      status: 'ACTIVE',
      expiresAt: { $gt: now },
      'items.variantId': variantId,
    })
      .lean()
      .exec()

    let total = 0
    for (const doc of docs) {
      for (const item of doc.items) {
        if (item.variantId === variantId) {
          total += item.qty
        }
      }
    }

    return total
  }
}
