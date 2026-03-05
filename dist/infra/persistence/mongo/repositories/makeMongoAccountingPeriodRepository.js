"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMongoAccountingPeriodRepository = void 0;
const AccountingPeriodStatus_1 = require("@domain/accounting-periods/AccountingPeriodStatus");
const mongoose_1 = __importDefault(require("mongoose"));
const accountingPeriod_model_1 = require("../models/accountingPeriod.model");
const toDomain = (doc) => ({
    id: doc._id.toString(),
    companyId: doc.companyId,
    name: doc.name,
    start: doc.start,
    end: doc.end,
    status: doc.status,
});
const makeMongoAccountingPeriodRepository = () => ({
    findById: async (id) => {
        const objectId = mongoose_1.default.Types.ObjectId.isValid(id) ? new mongoose_1.default.Types.ObjectId(id) : id;
        const doc = await accountingPeriod_model_1.AccountingPeriodModel.findOne({ _id: objectId }).lean();
        return doc ? toDomain(doc) : null;
    },
    findByDate: async (companyId, date) => {
        const doc = await accountingPeriod_model_1.AccountingPeriodModel.findOne({
            companyId,
            start: { $lte: date },
            end: { $gte: date },
        })
            .sort({ start: -1 })
            .lean();
        return doc ? toDomain(doc) : null;
    },
    findOpenByCompany: async (companyId) => {
        const docs = await accountingPeriod_model_1.AccountingPeriodModel.find({ companyId, status: AccountingPeriodStatus_1.AccountingPeriodStatus.OPEN }).sort({ start: 1 }).lean();
        return docs.map(toDomain);
    },
    findByCompany: async (companyId) => {
        const docs = await accountingPeriod_model_1.AccountingPeriodModel.find({ companyId }).sort({ start: -1 }).lean();
        return docs.map(toDomain);
    },
    save: async (period) => {
        const _id = period.id && mongoose_1.default.Types.ObjectId.isValid(period.id) ? new mongoose_1.default.Types.ObjectId(period.id) : undefined;
        if (_id) {
            await accountingPeriod_model_1.AccountingPeriodModel.updateOne({ _id }, { $set: { ...period } }, { upsert: true });
        }
        else {
            const doc = await accountingPeriod_model_1.AccountingPeriodModel.create({ ...period });
            period.id = doc._id.toString();
        }
    },
    markClosed: async (periodId) => {
        const objectId = mongoose_1.default.Types.ObjectId.isValid(periodId) ? new mongoose_1.default.Types.ObjectId(periodId) : periodId;
        await accountingPeriod_model_1.AccountingPeriodModel.updateOne({ _id: objectId }, { $set: { status: AccountingPeriodStatus_1.AccountingPeriodStatus.CLOSED } });
    },
    markOpenExclusive: async (companyId, periodId) => {
        const objectId = mongoose_1.default.Types.ObjectId.isValid(periodId) ? new mongoose_1.default.Types.ObjectId(periodId) : periodId;
        await accountingPeriod_model_1.AccountingPeriodModel.updateMany({ companyId, status: AccountingPeriodStatus_1.AccountingPeriodStatus.OPEN, _id: { $ne: objectId } }, { $set: { status: AccountingPeriodStatus_1.AccountingPeriodStatus.CLOSED } });
        await accountingPeriod_model_1.AccountingPeriodModel.updateOne({ _id: objectId }, { $set: { status: AccountingPeriodStatus_1.AccountingPeriodStatus.OPEN } });
    },
    lockById: async (periodId) => {
        const objectId = mongoose_1.default.Types.ObjectId.isValid(periodId) ? new mongoose_1.default.Types.ObjectId(periodId) : periodId;
        const doc = await accountingPeriod_model_1.AccountingPeriodModel.findOne({ _id: objectId }).lean();
        return doc ? toDomain(doc) : null;
    },
});
exports.makeMongoAccountingPeriodRepository = makeMongoAccountingPeriodRepository;
