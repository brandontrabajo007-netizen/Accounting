"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = require("../infra/persistence/mongo/connect");
const PurchaseAccountMapping_model_1 = require("../infra/persistence/mongo/models/PurchaseAccountMapping.model");
async function seed() {
    await (0, connect_1.connectToMongo)();
    const companyId = 'sahet';
    // Antes de crear, verificar si ya existe
    const exists = await PurchaseAccountMapping_model_1.PurchaseAccountMappingModel.findOne({ companyId });
    if (exists) {
        console.log(`↷ PurchaseAccountMapping ya existe para companyId: ${companyId}`);
        process.exit(0);
    }
    await PurchaseAccountMapping_model_1.PurchaseAccountMappingModel.create({
        companyId,
        vatAccount: 2402, // IVA descontable
        cashAccount: 1105, // Caja general
        bankAccount: 1110, // Bancos
        accountsPayableAccount: 2205, // Proveedores
    });
    console.log('✔ PurchaseAccountMapping creado correctamente');
    process.exit();
}
seed();
