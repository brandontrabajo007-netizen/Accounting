"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeGetInventorySettings = makeGetInventorySettings;
const resolveInventoryMode_1 = require("../services/resolveInventoryMode");
function makeGetInventorySettings(deps) {
    return async function getInventorySettings(command) {
        const mode = await (0, resolveInventoryMode_1.resolveInventoryMode)(deps.inventorySettingsRepo, command.companyId);
        return { mode };
    };
}
