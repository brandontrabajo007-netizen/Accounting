import express from 'express'
import { inventoryHealthHandler } from '../controllers/ops/healthController'
import { inventoryVersionHandler } from '../controllers/ops/versionController'

const router = express.Router()

router.get('/health', inventoryHealthHandler)
router.get('/version', inventoryVersionHandler)

export { router as opsRoutes }
