"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureInventoryIndexes = ensureInventoryIndexes;
const ProductModel_1 = require("../models/ProductModel");
const VariantModel_1 = require("../models/VariantModel");
const MovementModel_1 = require("../models/MovementModel");
const ReservationModel_1 = require("../models/ReservationModel");
const InventorySettingsModel_1 = require("../models/InventorySettingsModel");
async function ensureInventoryIndexes() {
    await ProductModel_1.ProductModel.syncIndexes();
    await VariantModel_1.VariantModel.syncIndexes();
    await MovementModel_1.MovementModel.syncIndexes();
    await ReservationModel_1.ReservationModel.syncIndexes();
    await InventorySettingsModel_1.InventorySettingsModel.syncIndexes();
}
