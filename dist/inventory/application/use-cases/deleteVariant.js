"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDeleteVariant = makeDeleteVariant;
const Result_1 = require("../types/Result");
const VariantId_1 = require("../../domain/value-objects/VariantId");
function makeDeleteVariant(deps) {
    return async function deleteVariant(command) {
        const variant = await deps.variantRepo.getById(command.companyId, VariantId_1.VariantId.from(command.variantId));
        if (!variant) {
            return Result_1.Result.err({ type: 'VariantNotFound', variantId: command.variantId });
        }
        const hasMovements = await deps.movementRepo.existsByVariant(command.companyId, VariantId_1.VariantId.from(command.variantId));
        if (hasMovements) {
            return Result_1.Result.err({ type: 'VariantHasMovements', variantId: command.variantId });
        }
        await deps.variantRepo.delete(command.companyId, VariantId_1.VariantId.from(command.variantId));
        return Result_1.Result.ok({ ok: true });
    };
}
