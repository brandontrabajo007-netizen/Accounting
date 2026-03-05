"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDeactivateVariant = makeDeactivateVariant;
const Result_1 = require("../types/Result");
const VariantId_1 = require("../../domain/value-objects/VariantId");
function makeDeactivateVariant(deps) {
    return async function deactivateVariant(command) {
        const variant = await deps.variantRepo.getById(command.companyId, VariantId_1.VariantId.from(command.variantId));
        if (!variant) {
            return Result_1.Result.err({ type: 'VariantNotFound', variantId: command.variantId });
        }
        await deps.variantRepo.deactivate(command.companyId, VariantId_1.VariantId.from(command.variantId));
        return Result_1.Result.ok({ ok: true });
    };
}
