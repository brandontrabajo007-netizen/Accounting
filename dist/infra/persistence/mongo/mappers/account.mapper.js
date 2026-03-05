"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountToMongo = exports.mongoToAccount = void 0;
const mongoToAccount = (doc) => ({
    code: doc.code,
    name: doc.name,
    type: doc.type,
    nature: doc.nature,
    currentBalanceByCompany: Object.fromEntries(doc.currentBalanceByCompany ?? []),
});
exports.mongoToAccount = mongoToAccount;
const accountToMongo = (account) => ({
    code: account.code,
    name: account.name,
    type: account.type,
    nature: account.nature,
    currentBalanceByCompany: new Map(Object.entries(account.currentBalanceByCompany)),
});
exports.accountToMongo = accountToMongo;
