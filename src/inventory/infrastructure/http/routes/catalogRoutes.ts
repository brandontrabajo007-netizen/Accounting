import express from 'express'
import {
  getCatalogAvailabilityHandler,
  getCatalogProductHandler,
  listCatalogProductsHandler,
} from '../controllers/catalog/catalogProductsController'
import { validateSaleHandler } from '../controllers/catalog/salesValidationController'
import {
  cancelReservationHandler,
  confirmReservationHandler,
  createReservationHandler,
} from '../controllers/catalog/reservationsController'

const router = express.Router()

router.get('/catalog/products', listCatalogProductsHandler)
router.get('/catalog/products/:productId', getCatalogProductHandler)
router.get('/catalog/products/:productId/availability', getCatalogAvailabilityHandler)

router.post('/sales/validate', validateSaleHandler)

router.post('/reservations', createReservationHandler)
router.post('/reservations/:reservationId/confirm', confirmReservationHandler)
router.post('/reservations/:reservationId/cancel', cancelReservationHandler)

export { router as catalogRoutes }
