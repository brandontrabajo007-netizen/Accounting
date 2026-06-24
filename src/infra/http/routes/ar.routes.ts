import express from 'express'
import { authMiddleware } from '../middleware/auth'
import { arCustomerRepository, arEntryRepository, arSettingsRepository, customerHistoryRepository } from '../dependencies'
import { normalizeCustomerName } from '@accounts-receivable/domain/normalizeCustomerName'

const router = express.Router()

const parseIntParam = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

router.get('/ar/settings', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const settings = await arSettingsRepository.getByCompanyId(req.user.companyId)

    return res.json({
      status: true,
      settings: settings ?? {
        companyId: req.user.companyId,
        enabled: false,
        defaultCreditWhenMissingPaymentMethod: true,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.put('/ar/settings', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const enabled = req.body?.enabled
    const defaultCreditWhenMissingPaymentMethod = req.body?.defaultCreditWhenMissingPaymentMethod

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ status: false, error: 'enabled debe ser boolean' })
    }
    if (typeof defaultCreditWhenMissingPaymentMethod !== 'boolean') {
      return res.status(400).json({ status: false, error: 'defaultCreditWhenMissingPaymentMethod debe ser boolean' })
    }

    const saved = await arSettingsRepository.save({
      companyId: req.user.companyId,
      enabled,
      defaultCreditWhenMissingPaymentMethod,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return res.json({ status: true, settings: saved })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/ar/customers', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const page = parseIntParam(req.query.page, 1)
    const limit = parseIntParam(req.query.limit, 50)
    const search = typeof req.query.search === 'string' ? req.query.search : undefined
    const includeBalance = req.query.includeBalance !== 'false'

    const { items, total } = await arCustomerRepository.listByCompany(req.user.companyId, { page, limit, search })

    if (!includeBalance) {
      return res.json({ status: true, items, total, page, limit })
    }

    const balances = await arEntryRepository.listBalancesByCompany(req.user.companyId)
    const balanceMap = new Map(balances.map((row) => [row.customerId, row.balance]))

    const itemsWithBalance = items.map((customer) => ({
      ...customer,
      balance: balanceMap.get(customer.id) ?? 0,
    }))

    return res.json({ status: true, items: itemsWithBalance, total, page, limit })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/ar/debtors', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const balances = await arEntryRepository.listBalancesByCompany(req.user.companyId)
    const debtors = balances.filter((row) => row.balance > 0)
    const customers = await arCustomerRepository.findByIds(debtors.map((row) => row.customerId))
    const customerMap = new Map(customers.map((customer) => [customer.id, customer]))

    const items = debtors
      .map((row) => {
        const customer = customerMap.get(row.customerId)
        if (!customer) return null
        return { customer, balance: row.balance }
      })
      .filter((row): row is { customer: typeof customers[number]; balance: number } => Boolean(row))

    return res.json({ status: true, items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/ar/customers/:customerId/balance', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const customerId = req.params.customerId
    const customer = await arCustomerRepository.findById(customerId)
    if (!customer || customer.companyId !== req.user.companyId) {
      return res.status(404).json({ status: false, error: 'Cliente no encontrado' })
    }

    const balance = await arEntryRepository.getBalanceByCustomer(req.user.companyId, customerId)
    return res.json({ status: true, customer, balance })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/ar/customers/:customerId/statement', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const customerId = req.params.customerId
    const customer = await arCustomerRepository.findById(customerId)
    if (!customer || customer.companyId !== req.user.companyId) {
      return res.status(404).json({ status: false, error: 'Cliente no encontrado' })
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
      customerHistoryRepository.listByCustomer(req.user.companyId, customerId, { from, to, page, limit, sort }),
      arEntryRepository.getBalanceByCustomer(req.user.companyId, customerId),
    ])

    return res.json({
      status: true,
      customer,
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

router.delete('/ar/customers/:customerId', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const customerId = req.params.customerId
    const customer = await arCustomerRepository.findById(customerId)
    if (!customer || customer.companyId !== req.user.companyId) {
      return res.status(404).json({ status: false, error: 'Cliente no encontrado' })
    }

    const balance = await arEntryRepository.getBalanceByCustomer(req.user.companyId, customerId)
    if (Math.abs(balance) > 0.0001) {
      return res.status(409).json({
        status: false,
        error: 'No se puede eliminar este cliente porque tiene saldo pendiente.',
        balance,
      })
    }

    const [deletedEntries, deletedHistory, deletedCustomer] = await Promise.all([
      arEntryRepository.deleteByCustomer(req.user.companyId, customerId),
      customerHistoryRepository.deleteByCustomer(req.user.companyId, customerId),
      arCustomerRepository.deleteById(req.user.companyId, customerId),
    ])

    if (!deletedCustomer) {
      return res.status(404).json({ status: false, error: 'Cliente no encontrado' })
    }

    return res.json({
      status: true,
      deleted: {
        customer: 1,
        entries: deletedEntries,
        history: deletedHistory,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.put('/ar/customers/:customerId', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const customerId = req.params.customerId
    const customer = await arCustomerRepository.findById(customerId)
    if (!customer || customer.companyId !== req.user.companyId) {
      return res.status(404).json({ status: false, error: 'Cliente no encontrado' })
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    if (!name) {
      return res.status(400).json({ status: false, error: 'El nombre del cliente es obligatorio' })
    }

    const updated = await arCustomerRepository.updateById(customerId, {
      name,
      normalizedName: normalizeCustomerName(name),
      documentNumber: typeof req.body?.documentNumber === 'string' ? req.body.documentNumber : null,
      phone: typeof req.body?.phone === 'string' ? req.body.phone : null,
      city: typeof req.body?.city === 'string' ? req.body.city : null,
      address: typeof req.body?.address === 'string' ? req.body.address : null,
    })

    if (!updated) {
      return res.status(404).json({ status: false, error: 'Cliente no encontrado' })
    }

    return res.json({ status: true, customer: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

router.get('/ar/customers/:customerId', authMiddleware, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ status: false, error: 'No autenticado' })

    const customerId = req.params.customerId
    const customer = await arCustomerRepository.findById(customerId)
    if (!customer || customer.companyId !== req.user.companyId) {
      return res.status(404).json({ status: false, error: 'Cliente no encontrado' })
    }

    return res.json({ status: true, customer })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return res.status(400).json({ status: false, error: message })
  }
})

export { router as arRoutes }
