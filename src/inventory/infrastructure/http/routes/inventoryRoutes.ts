import express from 'express'
import { adminRoutes } from './adminRoutes'
import { catalogRoutes } from './catalogRoutes'
import { internalRoutes } from './internalRoutes'
import { opsRoutes } from './opsRoutes'

const router = express.Router()

router.use('/', adminRoutes)
router.use('/', catalogRoutes)
router.use('/', internalRoutes)
router.use('/', opsRoutes)

export { router as inventoryRoutes }
