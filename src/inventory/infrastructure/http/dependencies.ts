import mongoose from 'mongoose'
import { MongoProductRepo } from '../repositories/MongoProductRepo'
import { MongoVariantRepo } from '../repositories/MongoVariantRepo'
import { MongoMovementRepo } from '../repositories/MongoMovementRepo'
import { MongoReservationRepo } from '../repositories/MongoReservationRepo'
import { MongoInventorySettingsRepo } from '../repositories/MongoInventorySettingsRepo'
import { makeCreateProduct } from '../../application/use-cases/createProduct'
import { makeUpdateProduct } from '../../application/use-cases/updateProduct'
import { makeDeactivateProduct } from '../../application/use-cases/deactivateProduct'
import { makeDeleteProduct } from '../../application/use-cases/deleteProduct'
import { makeCreateVariant } from '../../application/use-cases/createVariant'
import { makeUpdateVariant } from '../../application/use-cases/updateVariant'
import { makeDeactivateVariant } from '../../application/use-cases/deactivateVariant'
import { makeDeleteVariant } from '../../application/use-cases/deleteVariant'
import { makeRegisterReceipt } from '../../application/use-cases/registerReceipt'
import { makeRegisterAdjustment } from '../../application/use-cases/registerAdjustment'
import { makeValidateSaleCart } from '../../application/use-cases/validateSaleCart'
import { makeGetSaleCost } from '../../application/use-cases/getSaleCost'
import { makeConfirmSale } from '../../application/use-cases/confirmSale'
import { makeReverseSale } from '../../application/use-cases/reverseSale'
import { makeGetInventorySettings } from '../../application/use-cases/getInventorySettings'
import { makeUpdateInventorySettings } from '../../application/use-cases/updateInventorySettings'

export const productRepo = new MongoProductRepo()
export const variantRepo = new MongoVariantRepo()
export const movementRepo = new MongoMovementRepo()
export const reservationRepo = new MongoReservationRepo()
export const inventorySettingsRepo = new MongoInventorySettingsRepo()

export const idGenerator = () => new mongoose.Types.ObjectId().toHexString()

export const createProduct = makeCreateProduct({ productRepo, idGenerator })
export const updateProduct = makeUpdateProduct({ productRepo })
export const deactivateProduct = makeDeactivateProduct({ productRepo })
export const deleteProduct = makeDeleteProduct({ productRepo, variantRepo, movementRepo, reservationRepo })
export const createVariant = makeCreateVariant({ variantRepo, productRepo, inventorySettingsRepo, idGenerator })
export const updateVariant = makeUpdateVariant({ variantRepo, inventorySettingsRepo })
export const deactivateVariant = makeDeactivateVariant({ variantRepo, inventorySettingsRepo })
export const deleteVariant = makeDeleteVariant({ variantRepo, movementRepo, inventorySettingsRepo })

export const registerReceipt = makeRegisterReceipt({
  productRepo,
  variantRepo,
  movementRepo,
  inventorySettingsRepo,
  idGenerator,
})
export const registerAdjustment = makeRegisterAdjustment({
  productRepo,
  variantRepo,
  movementRepo,
  inventorySettingsRepo,
  idGenerator,
})

export const validateSaleCart = makeValidateSaleCart({
  productRepo,
  variantRepo,
  movementRepo,
  reservationRepo,
  inventorySettingsRepo,
})
export const getSaleCost = makeGetSaleCost({ productRepo })
export const confirmSale = makeConfirmSale({
  productRepo,
  variantRepo,
  movementRepo,
  reservationRepo,
  inventorySettingsRepo,
  idGenerator,
})
export const reverseSale = makeReverseSale({
  productRepo,
  variantRepo,
  movementRepo,
  inventorySettingsRepo,
  idGenerator,
})

export const getInventorySettings = makeGetInventorySettings({ inventorySettingsRepo })
export const updateInventorySettings = makeUpdateInventorySettings({
  inventorySettingsRepo,
  movementRepo,
  reservationRepo,
  variantRepo,
})
