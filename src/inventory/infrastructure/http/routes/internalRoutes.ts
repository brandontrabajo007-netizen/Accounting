import express from 'express'
import { internalSaleCostHandler } from '../controllers/internal/internalSalesCostController'
import { internalSaleConfirmHandler } from '../controllers/internal/internalSalesConfirmController'
import { internalSaleReverseHandler } from '../controllers/internal/internalSalesReverseController'
import { requireInventoryAuth } from '../middleware/requireInventoryAuth'

const router = express.Router()

router.use(requireInventoryAuth)

router.post('/internal/sales/cost', internalSaleCostHandler)
router.post('/internal/sales/confirm', internalSaleConfirmHandler)
router.post('/internal/sales/reverse', internalSaleReverseHandler)

export { router as internalRoutes }
