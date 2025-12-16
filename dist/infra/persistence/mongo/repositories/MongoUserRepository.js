"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoUserRepository = void 0;
const UserModel_1 = require("../models/UserModel");
class MongoUserRepository {
    async create(data) {
        const doc = await UserModel_1.UserMongoModel.create(data);
        return {
            id: doc._id.toString(),
            telegramId: doc.telegramId,
            name: doc.name,
            companyId: doc.companyId,
            phone: doc.phone,
            password: doc.password,
        };
    }
    async findByTelegramId(telegramId) {
        const doc = await UserModel_1.UserMongoModel.findOne({ telegramId });
        if (!doc)
            return null;
        return {
            id: doc._id.toString(),
            telegramId: doc.telegramId,
            name: doc.name,
            companyId: doc.companyId,
            phone: doc.phone,
            password: doc.password,
        };
    }
    // 👇 Necesario para login por ID o para generar token en Telegram
    async findById(id) {
        const doc = await UserModel_1.UserMongoModel.findById(id);
        if (!doc)
            return null;
        return {
            id: doc._id.toString(),
            telegramId: doc.telegramId,
            name: doc.name,
            companyId: doc.companyId,
            phone: doc.phone,
            password: doc.password,
        };
    }
    // 👇 NECESARIO para login con phone
    async findByPhone(phone) {
        const doc = await UserModel_1.UserMongoModel.findOne({ phone });
        if (!doc)
            return null;
        return {
            id: doc._id.toString(),
            telegramId: doc.telegramId,
            name: doc.name,
            companyId: doc.companyId,
            phone: doc.phone,
            password: doc.password,
        };
    }
    async update(id, data) {
        const doc = await UserModel_1.UserMongoModel.findByIdAndUpdate(id, data, {
            new: true,
        });
        if (!doc) {
            throw new Error('User not found');
        }
        return {
            id: doc._id.toString(),
            telegramId: doc.telegramId,
            name: doc.name,
            companyId: doc.companyId,
            phone: doc.phone,
            password: doc.password,
        };
    }
    async delete(id) {
        await UserModel_1.UserMongoModel.findByIdAndDelete(id);
    }
    async list() {
        const docs = await UserModel_1.UserMongoModel.find();
        return docs.map((doc) => ({
            id: doc._id.toString(),
            telegramId: doc.telegramId,
            name: doc.name,
            companyId: doc.companyId,
            phone: doc.phone,
            // No retornamos password en list (no es necesario)
        }));
    }
}
exports.MongoUserRepository = MongoUserRepository;
