"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saleRoutes = void 0;
const registerSale_1 = require("@application/eventos/sales/use-cases/registerSale");
const express_1 = __importDefault(require("express"));
const dependencies_1 = require("../dependencies");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
exports.saleRoutes = router;
const { registerSale } = (0, registerSale_1.makeRegisterSale)({
    accountRepository: dependencies_1.accountRepository,
    saleAccountMappingRepository: dependencies_1.saleAccountMappingRepository,
    journalEntryRepository: dependencies_1.journalEntryRepository,
    processJournalEntry: dependencies_1.processJournalEntry,
    periodAccessGuard: dependencies_1.periodAccessGuard,
    resolvePeriodId: dependencies_1.resolvePeriodId,
    accountsReceivable: dependencies_1.accountsReceivableOrchestrator,
    customerHistory: dependencies_1.customerHistoryService,
});
const asRecord = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return null;
    return value;
};
const readStringId = (...values) => {
    for (const value of values) {
        if (typeof value === 'string' && value.trim())
            return value.trim();
        if (typeof value === 'number' && Number.isFinite(value))
            return String(value);
    }
    return '';
};
const normalizeSaleItems = (body) => {
    const sources = [
        body.items,
        body.products,
        body.selectedProducts,
        body.lineItems,
        body.orderItems,
        body.cartItems,
    ];
    for (const source of sources) {
        if (!Array.isArray(source))
            continue;
        const parsed = source
            .map((item) => {
            if (!item || typeof item !== 'object')
                return null;
            const raw = item;
            const product = asRecord(raw.product);
            const variant = asRecord(raw.variant);
            const productId = readStringId(raw.productId, raw.product_id, product?.id, product?._id, product?.productId, product?.product_id);
            const variantId = readStringId(raw.variantId, raw.variant_id, variant?.id, variant?._id, variant?.variantId, variant?.variant_id) || productId;
            const qtyValue = Number(raw.qty ?? raw.quantity ?? raw.cantidad ?? raw.units ?? raw.unitQty ?? raw.unit_qty ?? 0);
            if (!productId || !Number.isFinite(qtyValue) || qtyValue <= 0) {
                return null;
            }
            return { productId, variantId, qty: qtyValue };
        })
            .filter((item) => Boolean(item));
        if (parsed.length > 0)
            return parsed;
    }
    return [];
};
const parsePositiveNumber = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0)
        return null;
    return numeric;
};
const resolveSaleId = (body, description) => {
    const order = asRecord(body.order);
    const reference = asRecord(body.reference);
    const reservation = asRecord(body.reservation);
    const direct = readStringId(body.saleId, body.reservationId, body.reservation_id, body.orderId, body.order_id, body.referenceId, body.reference_id, reservation?.id, order?.id, reference?.id);
    if (direct)
        return direct;
    const byDescription = description.match(/ORD-[A-Z0-9-]+/i)?.[0] ?? '';
    return byDescription;
};
const resolveReservationId = (body) => {
    const reservation = asRecord(body.reservation);
    return readStringId(body.reservationId, body.reservation_id, reservation?.id);
};
// Register sale (protected with JWT)
router.post('/sale', auth_1.authMiddleware, async (req, res) => {
    try {
        const body = req.body;
        if (!req.user) {
            return res.status(500).json({
                status: false,
                error: 'Usuario autenticado no encontrado en la peticion',
            });
        }
        const companyId = req.user.companyId;
        const bodyRecord = asRecord(body) ?? {};
        const descriptionValue = typeof body?.description === 'string' ? body.description : '';
        const reservationId = resolveReservationId(bodyRecord);
        const saleId = resolveSaleId(bodyRecord, descriptionValue);
        const saleItems = normalizeSaleItems(bodyRecord);
        const quantityFromItems = saleItems.reduce((sum, item) => sum + item.qty, 0);
        const quantityFromBody = parsePositiveNumber(body.quantity);
        let quantity = quantityFromItems > 0 ? quantityFromItems : quantityFromBody ?? undefined;
        let unitCost = parsePositiveNumber(body.unitCost);
        const totalCostFromBody = parsePositiveNumber(body.costTotal ?? body.totalCost ?? body.costoTotal);
        if (!unitCost && totalCostFromBody && (quantity ?? 0) > 0) {
            unitCost = totalCostFromBody / (quantity ?? 1);
        }
        if (!unitCost && saleItems.length > 0 && quantityFromItems > 0) {
            const costLookupSaleId = saleId || dependencies_1.inventoryGateway.idGenerator();
            const costResult = await dependencies_1.inventoryGateway.getSaleCost({
                companyId,
                saleId: costLookupSaleId,
                items: saleItems,
            });
            if (costResult.ok) {
                unitCost = quantityFromItems > 0 ? costResult.value.costTotal / quantityFromItems : null;
            }
        }
        if (!unitCost && reservationId) {
            const reservation = await dependencies_1.inventoryGateway.getReservationById(companyId, reservationId);
            if (reservation && reservation.items.length > 0) {
                const reservationItems = reservation.items.map((item) => ({
                    productId: String(item.productId),
                    variantId: String(item.variantId),
                    qty: Number(item.qty),
                }));
                const totalQty = reservationItems.reduce((sum, item) => sum + item.qty, 0);
                if (totalQty > 0) {
                    const costResult = await dependencies_1.inventoryGateway.getSaleCost({
                        companyId,
                        saleId: reservation.id,
                        items: reservationItems,
                    });
                    if (costResult.ok && costResult.value.costTotal > 0) {
                        if ((quantity ?? 0) <= 0)
                            quantity = totalQty;
                        unitCost = costResult.value.costTotal / totalQty;
                    }
                }
            }
        }
        if (!unitCost && saleId) {
            const saleMovements = await dependencies_1.inventoryGateway.findSaleMovements(companyId, saleId);
            if (saleMovements.length > 0) {
                const qtyByProduct = new Map();
                for (const movement of saleMovements) {
                    if (movement.type !== 'OUT' || !('qty' in movement))
                        continue;
                    const qty = Number(movement.qty);
                    if (!Number.isFinite(qty) || qty <= 0)
                        continue;
                    const productId = String(movement.productId ?? '').trim();
                    if (!productId)
                        continue;
                    qtyByProduct.set(productId, (qtyByProduct.get(productId) ?? 0) + qty);
                }
                let totalQty = 0;
                let totalCost = 0;
                for (const [productId, qty] of qtyByProduct.entries()) {
                    const product = await dependencies_1.inventoryGateway.getProductById(companyId, productId);
                    if (!product || !Number.isFinite(product.costUnit) || product.costUnit <= 0)
                        continue;
                    totalQty += qty;
                    totalCost += product.costUnit * qty;
                }
                if ((quantity ?? 0) <= 0 && totalQty > 0) {
                    quantity = totalQty;
                }
                if (totalQty > 0 && totalCost > 0) {
                    unitCost = totalCost / totalQty;
                }
            }
        }
        const includesCostFromBody = body.includesCost === true;
        const includesCost = includesCostFromBody || ((quantity ?? 0) > 0 && (unitCost ?? 0) > 0);
        const result = await registerSale({
            description: body.description,
            totalAmount: body.totalAmount,
            date: body.date,
            includesVAT: body.includesVAT,
            includesCost,
            quantity,
            unitCost: unitCost ?? undefined,
            unitPrice: body.unitPrice,
            customerName: body.customerName,
            paymentMethod: body.paymentMethod,
            companyId,
            periodId: body.periodId,
        });
        return res.status(201).json({
            status: true,
            journalEntry: result,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected error';
        return res.status(400).json({
            status: false,
            error: message,
        });
    }
});
