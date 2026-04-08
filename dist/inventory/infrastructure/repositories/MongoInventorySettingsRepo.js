"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoInventorySettingsRepo = void 0;
const InventorySettingsModel_1 = require("../db/mongo/models/InventorySettingsModel");
const toDomain = (doc) => ({
    companyId: doc.companyId,
    mode: doc.mode,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});
class MongoInventorySettingsRepo {
    async getByCompanyId(companyId) {
        const doc = await InventorySettingsModel_1.InventorySettingsModel.findOne({ companyId }).lean().exec();
        return doc ? toDomain(doc) : null;
    }
    async upsertMode(companyId, mode) {
        const now = new Date();
        const doc = await InventorySettingsModel_1.InventorySettingsModel.findOneAndUpdate({ companyId }, {
            $set: {
                mode,
                updatedAt: now,
            },
            $setOnInsert: {
                companyId,
                createdAt: now,
            },
        }, {
            upsert: true,
            new: true,
        })
            .lean()
            .exec();
        if (!doc) {
            throw new Error('No se pudo guardar la configuracion de inventario');
        }
        return toDomain(doc);
    }
}
exports.MongoInventorySettingsRepo = MongoInventorySettingsRepo;
