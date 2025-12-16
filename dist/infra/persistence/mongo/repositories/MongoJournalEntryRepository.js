"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoJournalEntryRepository = void 0;
const journalEntry_mapper_1 = require("../mappers/journalEntry.mapper");
const journalEntry_model_1 = require("../models/journalEntry.model");
class MongoJournalEntryRepository {
    async save(entry) {
        await journalEntry_model_1.JournalEntryModel.updateOne({ id: entry.id }, { $set: (0, journalEntry_mapper_1.journalEntryToMongo)(entry) }, { upsert: true });
    }
    async findById(id) {
        const doc = await journalEntry_model_1.JournalEntryModel.findOne({ id }).select('-_id -__v').lean();
        return doc ? (0, journalEntry_mapper_1.mongoToJournalEntry)(doc) : null;
    }
    async findByCompanyAndPeriod(companyId, start, end) {
        const docs = await journalEntry_model_1.JournalEntryModel.find({
            companyId,
            date: { $gte: start, $lte: end },
        })
            .select('-_id -__v')
            .sort({ date: 1 })
            .lean();
        return docs.map(journalEntry_mapper_1.mongoToJournalEntry);
    }
    async findByStatus(companyId, status) {
        const docs = await journalEntry_model_1.JournalEntryModel.find({ companyId, status }).select('-_id -__v').sort({ date: -1 }).lean();
        return docs.map(journalEntry_mapper_1.mongoToJournalEntry);
    }
    async deleteAllByCompany(companyId) {
        await journalEntry_model_1.JournalEntryModel.deleteMany({ companyId });
    }
    /* ---------------------------------------------------
       🔥 MÉTODO CLAVE: PAGINADO + FILTROS
    --------------------------------------------------- */
    async findPaginated(params) {
        const { companyId, page, limit, search, status, from, to } = params;
        const query = {
            companyId,
        };
        // 🔍 Texto (description o id)
        if (search) {
            query.$or = [{ description: { $regex: search, $options: 'i' } }, { id: { $regex: search, $options: 'i' } }];
        }
        // 🏷 Estado
        if (status) {
            query.status = status;
        }
        // 📅 Rango de fechas
        if (from || to) {
            query.date = {};
            if (from)
                query.date.$gte = from;
            if (to)
                query.date.$lte = to;
        }
        const result = await journalEntry_model_1.JournalEntryModel.paginate(query, {
            page,
            limit,
            sort: { date: -1 },
            lean: true,
            select: '-_id -__v',
        });
        return {
            docs: result.docs.map(journalEntry_mapper_1.mongoToJournalEntry),
            totalDocs: result.totalDocs,
            limit: result.limit,
            page: result.page ?? page,
            totalPages: result.totalPages,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage,
        };
    }
}
exports.MongoJournalEntryRepository = MongoJournalEntryRepository;
