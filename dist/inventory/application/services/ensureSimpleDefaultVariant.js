"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSimpleDefaultVariant = ensureSimpleDefaultVariant;
const VariantId_1 = require("../../domain/value-objects/VariantId");
async function ensureSimpleDefaultVariant(deps, input) {
    const existing = await deps.variantRepo.getSimpleDefaultByProductId(input.companyId, input.product.id);
    if (existing) {
        if (existing.active)
            return existing;
        const reactivated = {
            ...existing,
            active: true,
            updatedAt: new Date(),
        };
        await deps.variantRepo.update(reactivated);
        return reactivated;
    }
    const now = new Date();
    const created = {
        id: VariantId_1.VariantId.from(deps.idGenerator()),
        companyId: input.companyId,
        productId: input.product.id,
        attribute: 'presentacion',
        value: 'general',
        systemType: 'SIMPLE_DEFAULT',
        active: true,
        createdAt: now,
        updatedAt: now,
    };
    await deps.variantRepo.create(created);
    return created;
}
