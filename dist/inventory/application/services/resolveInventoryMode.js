"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveInventoryMode = resolveInventoryMode;
const InventorySettings_1 = require("../../domain/entities/InventorySettings");
async function resolveInventoryMode(inventorySettingsRepo, companyId) {
    const settings = await inventorySettingsRepo.getByCompanyId(companyId);
    return settings?.mode ?? InventorySettings_1.DEFAULT_INVENTORY_MODE;
}
