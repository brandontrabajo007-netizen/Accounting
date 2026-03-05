import express from 'express'
import { createProductHandler, getProductHandler, listProductsHandler, updateProductHandler } from '../controllers/admin/productsController'
import {
  createVariantHandler,
  deleteVariantHandler,
  deleteVariantHardHandler,
  listVariantsHandler,
  updateVariantHandler,
} from '../controllers/admin/variantsController'
import {
  getGlobalStockHandler,
  getProductStockHandler,
  getStockHandler,
  getVariantStockHandler,
} from '../controllers/admin/stockController'
import { listMovementsHandler } from '../controllers/admin/movementsController'
import { registerReceiptHandler } from '../controllers/admin/receiptsController'
import { registerAdjustmentHandler } from '../controllers/admin/adjustmentsController'
import { requireInventoryAuth } from '../middleware/requireInventoryAuth'

const router = express.Router()

router.use(requireInventoryAuth)

router.post('/products', createProductHandler)
router.get('/products', listProductsHandler)
router.get('/products/:productId', getProductHandler)
router.patch('/products/:productId', updateProductHandler)

router.post('/products/:productId/variants', createVariantHandler)
router.get('/products/:productId/variants', listVariantsHandler)
router.patch('/variants/:variantId', updateVariantHandler)
router.delete('/variants/:variantId', deleteVariantHandler)
router.delete('/variants/:variantId/hard', deleteVariantHardHandler)

router.get('/stock', getStockHandler)
router.get('/products/:productId/stock', getProductStockHandler)
router.get('/variants/:variantId/stock', getVariantStockHandler)
router.get('/stock/all', getGlobalStockHandler)

router.get('/movements', listMovementsHandler)

router.post('/receipts', registerReceiptHandler)
router.post('/adjustments', registerAdjustmentHandler)

export { router as adminRoutes }
