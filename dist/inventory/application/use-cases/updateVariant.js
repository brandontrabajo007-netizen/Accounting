"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeUpdateVariant = makeUpdateVariant;
const Result_1 = require("../types/Result");
const Sku_1 = require("../../domain/value-objects/Sku");
const VariantId_1 = require("../../domain/value-objects/VariantId");
function makeUpdateVariant(deps) {
    return async function updateVariant(command) {
        const variant = await deps.variantRepo.getById(command.companyId, VariantId_1.VariantId.from(command.variantId));
        if (!variant) {
            return Result_1.Result.err({ type: 'VariantNotFound', variantId: command.variantId });
        }
        const updated = {
            ...variant,
            attribute: command.attribute ?? variant.attribute,
            value: command.value ?? variant.value,
            active: command.active ?? variant.active,
            skuVariant: command.skuVariant === null
                ? undefined
                : command.skuVariant
                    ? Sku_1.Sku.from(command.skuVariant)
                    : variant.skuVariant,
            updatedAt: new Date(),
        };
        await deps.variantRepo.update(updated);
        return Result_1.Result.ok({ variant: updated });
    };
}
