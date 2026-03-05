import { ProductModel } from '../models/ProductModel'
import { VariantModel } from '../models/VariantModel'
import { MovementModel } from '../models/MovementModel'
import { ReservationModel } from '../models/ReservationModel'

export async function ensureInventoryIndexes() {
  await ProductModel.syncIndexes()
  await VariantModel.syncIndexes()
  await MovementModel.syncIndexes()
  await ReservationModel.syncIndexes()
}
