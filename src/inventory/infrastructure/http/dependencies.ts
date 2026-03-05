import mongoose from 'mongoose'
import { MongoProductRepo } from '../repositories/MongoProductRepo'
import { MongoVariantRepo } from '../repositories/MongoVariantRepo'
import { MongoMovementRepo } from '../repositories/MongoMovementRepo'
import { MongoReservationRepo } from '../repositories/MongoReservationRepo'
import { makeCreateProduct } from '../../application/use-cases/createProduct'
import { makeUpdateProduct } from '../../application/use-cases/updateProduct'
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

export const productRepo = new MongoProductRepo()
export const variantRepo = new MongoVariantRepo()
export const movementRepo = new MongoMovementRepo()
export const reservationRepo = new MongoReservationRepo()

export const idGenerator = () => new mongoose.Types.ObjectId().toHexString()

export const createProduct = makeCreateProduct({ productRepo, idGenerator })
export const updateProduct = makeUpdateProduct({ productRepo })
export const createVariant = makeCreateVariant({ variantRepo, productRepo, idGenerator })
export const updateVariant = makeUpdateVariant({ variantRepo })
export const deactivateVariant = makeDeactivateVariant({ variantRepo })
export const deleteVariant = makeDeleteVariant({ variantRepo, movementRepo })

export const registerReceipt = makeRegisterReceipt({ productRepo, variantRepo, movementRepo, idGenerator })
export const registerAdjustment = makeRegisterAdjustment({ productRepo, variantRepo, movementRepo, idGenerator })

export const validateSaleCart = makeValidateSaleCart({ productRepo, variantRepo, movementRepo, reservationRepo })
export const getSaleCost = makeGetSaleCost({ productRepo })
export const confirmSale = makeConfirmSale({ productRepo, variantRepo, movementRepo, reservationRepo, idGenerator })
export const reverseSale = makeReverseSale({ productRepo, variantRepo, movementRepo, idGenerator })
