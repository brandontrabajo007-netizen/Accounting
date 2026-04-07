"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoPendingEventRepository = void 0;
const pendingEvent_model_1 = require("../models/pendingEvent.model");
const toDomain = (doc) => ({
    id: doc._id.toString(),
    companyId: doc.companyId,
    telegramUserId: doc.telegramUserId,
    eventType: doc.eventType,
    interpretedData: doc.interpretedData ?? {},
    metadata: doc.metadata ?? null,
    status: doc.status,
    createdAt: doc.createdAt,
    expiresAt: doc.expiresAt ?? null,
});
class MongoPendingEventRepository {
    async create(input) {
        const doc = await pendingEvent_model_1.PendingEventMongoModel.create({
            companyId: input.companyId,
            telegramUserId: input.telegramUserId,
            eventType: input.eventType,
            interpretedData: input.interpretedData,
            metadata: input.metadata ?? null,
            status: input.status,
            expiresAt: input.expiresAt ?? null,
            createdAt: input.createdAt ?? new Date(),
        });
        return toDomain(doc);
    }
    async findById(id) {
        const doc = await pendingEvent_model_1.PendingEventMongoModel.findById(id).lean();
        return doc ? toDomain(doc) : null;
    }
    async listByCompany(params) {
        const page = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1;
        const limit = Number.isFinite(params.limit) && params.limit > 0 ? Math.floor(params.limit) : 100;
        const skip = (page - 1) * limit;
        const query = { companyId: params.companyId };
        if (params.eventType)
            query.eventType = params.eventType;
        if (params.statuses && params.statuses.length > 0) {
            query.status = { $in: params.statuses };
        }
        if (params.from || params.to) {
            const createdAt = {};
            if (params.from)
                createdAt.$gte = params.from;
            if (params.to)
                createdAt.$lte = params.to;
            query.createdAt = createdAt;
        }
        const [docs, total] = await Promise.all([
            pendingEvent_model_1.PendingEventMongoModel.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
            pendingEvent_model_1.PendingEventMongoModel.countDocuments(query),
        ]);
        return {
            items: docs.map((doc) => toDomain(doc)),
            total,
        };
    }
    async findLatestPendingByTelegramUserId(telegramUserId, eventType) {
        const query = {
            telegramUserId,
            status: 'PENDING_CONFIRMATION',
        };
        if (eventType) {
            query.eventType = eventType;
        }
        const doc = await pendingEvent_model_1.PendingEventMongoModel.findOne(query).sort({ createdAt: -1 }).lean();
        return doc ? toDomain(doc) : null;
    }
    async updateData(id, interpretedData, metadata) {
        const doc = await pendingEvent_model_1.PendingEventMongoModel.findByIdAndUpdate(id, {
            interpretedData,
            metadata: metadata ?? null,
        }, { new: true }).lean();
        return doc ? toDomain(doc) : null;
    }
    async updateStatus(id, status) {
        const doc = await pendingEvent_model_1.PendingEventMongoModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
        return doc ? toDomain(doc) : null;
    }
    async expirePastDue(now = new Date()) {
        const result = await pendingEvent_model_1.PendingEventMongoModel.updateMany({
            status: 'PENDING_CONFIRMATION',
            expiresAt: { $ne: null, $lt: now },
        }, { status: 'EXPIRED' });
        return result.modifiedCount ?? 0;
    }
}
exports.MongoPendingEventRepository = MongoPendingEventRepository;
