"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventorySettingsHandler = getInventorySettingsHandler;
exports.updateInventorySettingsHandler = updateInventorySettingsHandler;
const dependencies_1 = require("../../dependencies");
const adminSchemas_1 = require("../../validation/adminSchemas");
const modeChangeMessages = {
    HAS_MOVEMENTS: 'No se puede cambiar a SIMPLE porque ya existen movimientos de inventario.',
    HAS_RESERVATIONS: 'No se puede cambiar a SIMPLE porque existen reservas registradas.',
    HAS_USER_VARIANTS: 'No se puede cambiar a SIMPLE porque existen variantes creadas para la empresa.',
};
async function getInventorySettingsHandler(req, res) {
    const companyId = req.user.companyId;
    const settings = await (0, dependencies_1.getInventorySettings)({ companyId });
    return res.json({ mode: settings.mode });
}
async function updateInventorySettingsHandler(req, res) {
    const companyId = req.user.companyId;
    const body = adminSchemas_1.updateInventorySettingsSchema.parse(req.body);
    const result = await (0, dependencies_1.updateInventorySettings)({ companyId, mode: body.mode });
    if (!result.ok) {
        if (result.error.type === 'InventoryModeChangeNotAllowed') {
            return res.status(409).json({
                ok: false,
                error: result.error,
                message: modeChangeMessages[result.error.reason],
            });
        }
        return res.status(400).json({ ok: false, error: result.error });
    }
    return res.json({ ok: true, mode: result.value.mode });
}
