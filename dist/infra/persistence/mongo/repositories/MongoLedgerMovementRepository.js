"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoLedgerMovementRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const LedgerMovementModel_1 = require("../models/LedgerMovementModel");
const toDomain = (doc) => ({
    id: doc._id.toString(),
    accountCode: doc.accountCode,
    debit: doc.debit,
    credit: doc.credit,
    date: doc.date,
    journalEntryId: doc.journalEntryId,
    description: doc.description,
    companyId: doc.companyId,
    status: doc.status,
    periodId: doc.periodId,
    createdAt: doc.createdAt,
});
const buildFilter = ({ companyId, accountCode, periodId, from, to }) => {
    const filter = { companyId, accountCode };
    if (periodId)
        filter.periodId = periodId;
    if (from || to) {
        filter.date = {};
        if (from)
            filter.date.$gte = from;
        if (to)
            filter.date.$lte = to;
    }
    return filter;
};
const emptyTotals = { debit: 0, credit: 0 };
class MongoLedgerMovementRepository {
    async aggregateTotals(filter) {
        const [agg] = await LedgerMovementModel_1.LedgerMovementMongoModel.aggregate([
            { $match: filter },
            { $group: { _id: null, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
        ]);
        return agg ? { debit: agg.debit ?? 0, credit: agg.credit ?? 0 } : emptyTotals;
    }
    async findByAccount(params) {
        const { page, limit } = params;
        const skip = (page - 1) * limit;
        const filter = buildFilter(params);
        const [docs, total, totalsAgg] = await Promise.all([
            LedgerMovementModel_1.LedgerMovementMongoModel.find(filter).sort({ date: 1, createdAt: 1, _id: 1 }).skip(skip).limit(limit).lean(),
            LedgerMovementModel_1.LedgerMovementMongoModel.countDocuments(filter),
            LedgerMovementModel_1.LedgerMovementMongoModel.aggregate([
                { $match: filter },
                { $group: { _id: null, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
            ]),
        ]);
        const totals = totalsAgg[0] ? { debit: totalsAgg[0].debit ?? 0, credit: totalsAgg[0].credit ?? 0 } : emptyTotals;
        return {
            items: docs.map(toDomain),
            total,
            totals,
        };
    }
    async sumBefore(params) {
        const { companyId, accountCode, periodId, before } = params;
        const filter = buildFilter({ companyId, accountCode, periodId });
        filter.date = { $lt: before };
        return this.aggregateTotals(filter);
    }
    async sumBeforeCursor(params) {
        const filter = buildFilter(params);
        const { date, createdAt, id } = params.cursor;
        const cursorFilter = [
            { date: { $lt: date } },
            { date, createdAt: { $lt: createdAt } },
        ];
        if (mongoose_1.default.Types.ObjectId.isValid(id)) {
            cursorFilter.push({
                date,
                createdAt,
                _id: { $lt: new mongoose_1.default.Types.ObjectId(id) },
            });
        }
        filter.$or = cursorFilter;
        return this.aggregateTotals(filter);
    }
}
exports.MongoLedgerMovementRepository = MongoLedgerMovementRepository;
