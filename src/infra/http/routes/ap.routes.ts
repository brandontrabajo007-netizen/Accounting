import express from 'express'
import { authMiddleware } from '../middleware/auth'
import { apSupplierRepository, apEntryRepository, apSettingsRepository, supplierHistoryRepository } from '../dependencies'

const router = express.Router()

const parseIntParam = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

router.get('/ap/settings', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const settings = await apSettingsRepository.getByCompanyId(req.user.companyId)

    return res.json({
      status: true,
      settings: settings ?? {
        companyId: req.user.companyId,
        enabled: false,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.put('/ap/settings', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const enabled = req.body?.enabled

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ status: false, error: 'enabled debe ser boolean' })
    }

    const saved = await apSettingsRepository.save({
      companyId: req.user.companyId,
      enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return res.json({ status: true, settings: saved })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/ap/suppliers', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const page = parseIntParam(req.query.page, 1)
    const limit = parseIntParam(req.query.limit, 50)
    const search = typeof req.query.search === 'string' ? req.query.search : undefined
    const includeBalance = req.query.includeBalance !== 'false'

    const { items, total } = await apSupplierRepository.listByCompany(req.user.companyId, { page, limit, search })

    if (!includeBalance) {
      return res.json({ status: true, items, total, page, limit })
    }

    const balances = await apEntryRepository.listBalancesByCompany(req.user.companyId)
    const balanceMap = new Map(balances.map((row) => [row.supplierId, row.balance]))

    const itemsWithBalance = items.map((supplier) => ({
      ...supplier,
      balance: balanceMap.get(supplier.id) ?? 0,
    }))

    return res.json({ status: true, items: itemsWithBalance, total, page, limit })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/ap/creditors', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const balances = await apEntryRepository.listBalancesByCompany(req.user.companyId)
    const creditors = balances.filter((row) => row.balance > 0)
    const suppliers = await apSupplierRepository.findByIds(creditors.map((row) => row.supplierId))
    const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]))

    const items = creditors
      .map((row) => {
        const supplier = supplierMap.get(row.supplierId)
        if (!supplier) return null
        return { supplier, balance: row.balance }
      })
      .filter((row): row is { supplier: typeof suppliers[number]; balance: number } => Boolean(row))

    return res.json({ status: true, items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/ap/suppliers/:supplierId/balance', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const supplierId = req.params.supplierId
    const supplier = await apSupplierRepository.findById(supplierId)
    if (!supplier || supplier.companyId !== req.user.companyId) {
      return res.status(404).json({ status: false, error: 'Proveedor no encontrado' })
    }

    const balance = await apEntryRepository.getBalanceBySupplier(req.user.companyId, supplierId)
    return res.json({ status: true, supplier, balance })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/ap/suppliers/:supplierId/statement', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const supplierId = req.params.supplierId
    const supplier = await apSupplierRepository.findById(supplierId)
    if (!supplier || supplier.companyId !== req.user.companyId) {
      return res.status(404).json({ status: false, error: 'Proveedor no encontrado' })
    }

    const from = typeof req.query.from === 'string' ? new Date(req.query.from) : undefined
    const to = typeof req.query.to === 'string' ? new Date(req.query.to) : undefined
    if (from && Number.isNaN(from.getTime())) {
      return res.status(400).json({ status: false, error: 'from invalido' })
    }
    if (to && Number.isNaN(to.getTime())) {
      return res.status(400).json({ status: false, error: 'to invalido' })
    }

    const page = parseIntParam(req.query.page, 1)
    const limit = parseIntParam(req.query.limit, 100)
    const sort = req.query.sort === 'desc' ? 'desc' : 'asc'

    const [history, balance] = await Promise.all([
      supplierHistoryRepository.listBySupplier(req.user.companyId, supplierId, { from, to, page, limit, sort }),
      apEntryRepository.getBalanceBySupplier(req.user.companyId, supplierId),
    ])

    return res.json({
      status: true,
      supplier,
      balance,
      history: history.items,
      page,
      limit,
      total: history.total,
      sort,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/ap/suppliers/:supplierId', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const supplierId = req.params.supplierId
    const supplier = await apSupplierRepository.findById(supplierId)
    if (!supplier || supplier.companyId !== req.user.companyId) {
      return res.status(404).json({ status: false, error: 'Proveedor no encontrado' })
    }

    return res.json({ status: true, supplier })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

export { router as apRoutes }
