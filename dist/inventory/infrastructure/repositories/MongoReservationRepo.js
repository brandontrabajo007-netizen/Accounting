"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoReservationRepo = void 0;
const ReservationModel_1 = require("../db/mongo/models/ReservationModel");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const Quantity_1 = require("../../domain/value-objects/Quantity");
const VariantId_1 = require("../../domain/value-objects/VariantId");
class MongoReservationRepo {
    async getById(companyId, id) {
        const doc = await ReservationModel_1.ReservationModel.findOne({ _id: id, companyId }).lean().exec();
        if (!doc)
            return null;
        return {
            id: doc._id,
            companyId: doc.companyId,
            items: doc.items.map((item) => ({
                productId: ProductId_1.ProductId.from(item.productId),
                variantId: VariantId_1.VariantId.from(item.variantId),
                qty: Quantity_1.Quantity.from(item.qty),
            })),
            status: doc.status,
            expiresAt: doc.expiresAt,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }
    async create(reservation) {
        await ReservationModel_1.ReservationModel.create({
            _id: reservation.id,
            companyId: reservation.companyId,
            items: reservation.items,
            status: reservation.status,
            expiresAt: reservation.expiresAt,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
        });
    }
    async updateStatus(companyId, id, status) {
        await ReservationModel_1.ReservationModel.updateOne({ _id: id, companyId }, { $set: { status, updatedAt: new Date() } });
    }
    async listActiveQtyByVariant(companyId, variantId) {
        const now = new Date();
        const docs = await ReservationModel_1.ReservationModel.find({
            companyId,
            status: 'ACTIVE',
            expiresAt: { $gt: now },
            'items.variantId': variantId,
        })
            .lean()
            .exec();
        let total = 0;
        for (const doc of docs) {
            for (const item of doc.items) {
                if (item.variantId === variantId) {
                    total += item.qty;
                }
            }
        }
        return total;
    }
    async listActiveQtyByProduct(companyId, productId) {
        const now = new Date();
        const docs = await ReservationModel_1.ReservationModel.find({
            companyId,
            status: 'ACTIVE',
            expiresAt: { $gt: now },
            'items.productId': productId,
        })
            .lean()
            .exec();
        let total = 0;
        for (const doc of docs) {
            for (const item of doc.items) {
                if (item.productId === productId) {
                    total += item.qty;
                }
            }
        }
        return total;
    }
    async existsByCompany(companyId) {
        const doc = await ReservationModel_1.ReservationModel.findOne({ companyId }).select({ _id: 1 }).lean().exec();
        return Boolean(doc);
    }
}
exports.MongoReservationRepo = MongoReservationRepo;
