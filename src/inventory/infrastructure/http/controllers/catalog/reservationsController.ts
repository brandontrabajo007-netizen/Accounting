import type { Request, Response } from 'express'
import { reservationRepo, idGenerator, validateSaleCart, confirmSale } from '../../dependencies'
import { ProductId } from '../../../../domain/value-objects/ProductId'
import { Quantity } from '../../../../domain/value-objects/Quantity'
import { VariantId } from '../../../../domain/value-objects/VariantId'
import { catalogCompanyQuerySchema, createReservationSchema } from '../../validation/catalogSchemas'

export async function createReservationHandler(req: Request, res: Response) {
  const body = createReservationSchema.parse(req.body)

  const validation = await validateSaleCart({ companyId: body.companyId, items: body.items })
  if (!validation.ok || !validation.value.ok) {
    return res.status(400).json({ ok: false, issues: validation.ok ? validation.value.issues : validation.error })
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + body.ttlMinutes * 60 * 1000)
  const reservationId = idGenerator()

  const items = body.items.map((item) => ({
    productId: ProductId.from(item.productId),
    variantId: VariantId.from(item.variantId),
    qty: Quantity.from(item.qty),
  }))

  await reservationRepo.create({
    id: reservationId,
    companyId: body.companyId,
    items,
    status: 'ACTIVE',
    expiresAt,
    createdAt: now,
    updatedAt: now,
  })

  return res.status(201).json({ reservationId, expiresAt })
}

export async function confirmReservationHandler(req: Request, res: Response) {
  const query = catalogCompanyQuerySchema.parse(req.query)
  const { reservationId } = req.params
  const reservation = await reservationRepo.getById(query.companyId, reservationId)
  if (!reservation) {
    return res.status(404).json({ ok: false, error: 'ReservationNotFound' })
  }

  if (reservation.status !== 'ACTIVE' || reservation.expiresAt <= new Date()) {
    return res.status(400).json({ ok: false, error: 'ReservationNotActive' })
  }

  const result = await confirmSale({
    companyId: query.companyId,
    saleId: reservationId,
    items: reservation.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      qty: item.qty,
    })),
    reference: 'reservation-confirm',
    // The reservation being confirmed already holds stock; do not subtract active reservations again.
    ignoreActiveReservations: true,
  })

  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error })
  }

  await reservationRepo.updateStatus(query.companyId, reservationId, 'CONFIRMED')

  return res.json({ ok: true })
}

export async function cancelReservationHandler(req: Request, res: Response) {
  const query = catalogCompanyQuerySchema.parse(req.query)
  const { reservationId } = req.params
  const reservation = await reservationRepo.getById(query.companyId, reservationId)
  if (!reservation) {
    return res.status(404).json({ ok: false, error: 'ReservationNotFound' })
  }

  await reservationRepo.updateStatus(query.companyId, reservationId, 'CANCELLED')

  return res.json({ ok: true })
}
