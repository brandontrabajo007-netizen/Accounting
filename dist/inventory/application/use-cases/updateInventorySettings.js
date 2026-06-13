"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeUpdateInventorySettings = makeUpdateInventorySettings;
const Result_1 = require("../types/Result");
const resolveInventoryMode_1 = require("../services/resolveInventoryMode");
function makeUpdateInventorySettings(deps) {
    return async function updateInventorySettings(command) {
        const currentMode = await (0, resolveInventoryMode_1.resolveInventoryMode)(deps.inventorySettingsRepo, command.companyId);
        if (currentMode === command.mode) {
            return Result_1.Result.ok({ mode: currentMode });
        }
        if (command.mode === 'SIMPLE') {
            const [hasMovements, hasReservations, hasUserVariants] = await Promise.all([
                deps.movementRepo.existsForActiveProductsByCompany(command.companyId),
                deps.reservationRepo.existsByCompany(command.companyId),
                deps.variantRepo.existsUserManagedByCompany(command.companyId),
            ]);
            if (hasMovements) {
                return Result_1.Result.err({ type: 'InventoryModeChangeNotAllowed', reason: 'HAS_MOVEMENTS' });
            }
            if (hasReservations) {
                return Result_1.Result.err({ type: 'InventoryModeChangeNotAllowed', reason: 'HAS_RESERVATIONS' });
            }
            if (hasUserVariants) {
                return Result_1.Result.err({ type: 'InventoryModeChangeNotAllowed', reason: 'HAS_USER_VARIANTS' });
            }
        }
        const updated = await deps.inventorySettingsRepo.upsertMode(command.companyId, command.mode);
        return Result_1.Result.ok({ mode: updated.mode });
    };
}
