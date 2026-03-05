"use strict";
// src/infra/persistence/mongo/mappers/saleAccountMapping.mapper.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoToSaleAccountConfig = void 0;
const mongoToSaleAccountConfig = (doc) => ({
    companyId: doc.companyId,
    cashAccount: doc.cashAccount,
    incomeAccount: doc.incomeAccount,
    vatAccount: doc.vatAccount ?? undefined,
    cogsAccount: doc.cogsAccount ?? undefined,
    inventoryAccount: doc.inventoryAccount ?? undefined,
    accountsReceivableAccount: doc.accountsReceivableAccount ?? undefined,
});
exports.mongoToSaleAccountConfig = mongoToSaleAccountConfig;
