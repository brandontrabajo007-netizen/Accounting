"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = require("../infra/persistence/mongo/connect");
const saleAccountMapping_model_1 = require("../infra/persistence/mongo/models/saleAccountMapping.model");
async function seed() {
    await (0, connect_1.connectToMongo)();
    await saleAccountMapping_model_1.SaleAccountMappingModel.create({
        companyId: 'sahet',
        cashAccount: 1105,
        accountsReceivableAccount: 1305,
        incomeAccount: 4101,
        vatAccount: 2408,
        cogsAccount: 6135,
        inventoryAccount: 1435,
    });
    console.log('✔ SaleAccountMapping creado correctamente');
    process.exit();
}
seed();
