"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToMongo = connectToMongo;
const env_1 = require("@config/env");
const mongoose_1 = __importDefault(require("mongoose"));
async function connectToMongo() {
    try {
        await mongoose_1.default.connect(env_1.env.db.mongoUri, {
            dbName: env_1.env.db.mongoDbName,
        });
        console.log('🟢 MongoDB conectado correctamente');
    }
    catch (err) {
        console.error('🔴 Error conectando a MongoDB:', err);
        process.exit(1);
    }
}
