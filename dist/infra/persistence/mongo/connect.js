"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToMongo = connectToMongo;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
async function connectToMongo() {
    try {
        const mongoUri = process.env.MONGO_URI;
        const mongoDbName = process.env.MONGO_DB_NAME;
        if (!mongoUri) {
            throw new Error('❌ MONGO_URI no está definida en el archivo .env');
        }
        if (!mongoDbName) {
            throw new Error('❌ MONGO_DB_NAME no está definida en el archivo .env');
        }
        await mongoose_1.default.connect(mongoUri, { dbName: mongoDbName });
        console.log('🟢 MongoDB conectado correctamente');
    }
    catch (err) {
        console.error('🔴 Error conectando a MongoDB:', err);
        process.exit(1);
    }
}
