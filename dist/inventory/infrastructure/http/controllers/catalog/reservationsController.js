"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReservationHandler = createReservationHandler;
exports.confirmReservationHandler = confirmReservationHandler;
exports.cancelReservationHandler = cancelReservationHandler;
const dependencies_1 = require("../../dependencies");
const ProductId_1 = require("../../../../domain/value-objects/ProductId");
const Quantity_1 = require("../../../../domain/value-objects/Quantity");
const VariantId_1 = require("../../../../domain/value-objects/VariantId");
const catalogSchemas_1 = require("../../validation/catalogSchemas");
async function createReservationHandler(req, res) {
    const body = catalogSchemas_1.createReservationSchema.parse(req.body);
    const validation = await (0, dependencies_1.validateSaleCart)({ companyId: body.companyId, items: body.items });
    if (!validation.ok || !validation.value.ok) {
        return res.status(400).json({ ok: false, issues: validation.ok ? validation.value.issues : validation.error });
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + body.ttlMinutes * 60 * 1000);
    const reservationId = (0, dependencies_1.idGenerator)();
    const items = body.items.map((item) => ({
        productId: ProductId_1.ProductId.from(item.productId),
        variantId: VariantId_1.VariantId.from(item.variantId),
        qty: Quantity_1.Quantity.from(item.qty),
    }));
    await dependencies_1.reservationRepo.create({
        id: reservationId,
        companyId: body.companyId,
        items,
        status: 'ACTIVE',
        expiresAt,
        createdAt: now,
        updatedAt: now,
    });
    return res.status(201).json({ reservationId, expiresAt });
}
async function confirmReservationHandler(req, res) {
    const query = catalogSchemas_1.catalogCompanyQuerySchema.parse(req.query);
    const { reservationId } = req.params;
    const reservation = await dependencies_1.reservationRepo.getById(query.companyId, reservationId);
    if (!reservation) {
        return res.status(404).json({ ok: false, error: 'ReservationNotFound' });
    }
    if (reservation.status !== 'ACTIVE' || reservation.expiresAt <= new Date()) {
        return res.status(400).json({ ok: false, error: 'ReservationNotActive' });
    }
    const result = await (0, dependencies_1.confirmSale)({
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
    });
    if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.error });
    }
    await dependencies_1.reservationRepo.updateStatus(query.companyId, reservationId, 'CONFIRMED');
    return res.json({ ok: true });
}
async function cancelReservationHandler(req, res) {
    const query = catalogSchemas_1.catalogCompanyQuerySchema.parse(req.query);
    const { reservationId } = req.params;
    const reservation = await dependencies_1.reservationRepo.getById(query.companyId, reservationId);
    if (!reservation) {
        return res.status(404).json({ ok: false, error: 'ReservationNotFound' });
    }
    await dependencies_1.reservationRepo.updateStatus(query.companyId, reservationId, 'CANCELLED');
    return res.json({ ok: true });
}
