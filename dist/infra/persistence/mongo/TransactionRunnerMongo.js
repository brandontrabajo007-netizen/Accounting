"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMongoTransactionRunner = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const makeMongoTransactionRunner = () => ({
    runInTransaction: async (operation) => {
        const session = await mongoose_1.default.startSession();
        try {
            let result;
            await session.withTransaction(async () => {
                result = await operation();
            });
            return result;
        }
        finally {
            await session.endSession();
        }
    },
});
exports.makeMongoTransactionRunner = makeMongoTransactionRunner;
