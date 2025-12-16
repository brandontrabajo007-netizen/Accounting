"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = require("../infra/persistence/mongo/connect");
const PayrollAccountMapping_model_1 = require("../infra/persistence/mongo/models/PayrollAccountMapping.model");
async function seed() {
    await (0, connect_1.connectToMongo)();
    const companyId = 'sahet';
    // Verificar si ya existe para evitar duplicados
    const exists = await PayrollAccountMapping_model_1.PayrollAccountMappingModel.findOne({ companyId });
    if (exists) {
        console.log(`↷ PayrollAccountMapping ya existe para companyId: ${companyId}`);
        process.exit(0);
    }
    await PayrollAccountMapping_model_1.PayrollAccountMappingModel.create({
        companyId,
        expenseAccount: 5105, // Gastos de personal / Nómina
        cashAccount: 1105, // Caja general
        bankAccount: 1110, // Bancos
    });
    console.log('✔ PayrollAccountMapping creado correctamente');
    process.exit();
}
seed();
