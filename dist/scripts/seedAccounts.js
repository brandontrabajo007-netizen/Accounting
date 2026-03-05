"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AccountType_1 = require("@domain/accounts/AccountType");
const connect_1 = require("../infra/persistence/mongo/connect");
const account_model_1 = require("../infra/persistence/mongo/models/account.model");
async function seed() {
    await (0, connect_1.connectToMongo)();
    const accounts = [
        {
            code: 5195,
            name: 'Gastos operativos',
            type: AccountType_1.AccountType.EXPENSE,
            nature: 'debit',
        },
        {
            code: 5135,
            name: 'Servicios',
            type: AccountType_1.AccountType.EXPENSE,
            nature: 'debit',
        },
        {
            code: 1524,
            name: 'Propiedades, planta y equipo',
            type: AccountType_1.AccountType.ASSET,
            nature: 'debit',
        },
        {
            code: 5105,
            name: 'Gastos de personal (nómina)',
            type: AccountType_1.AccountType.EXPENSE,
            nature: 'debit',
        },
    ];
    for (const acc of accounts) {
        const exists = await account_model_1.AccountModel.findOne({ code: acc.code });
        if (!exists) {
            await account_model_1.AccountModel.create(acc);
            console.log(`✔ Cuenta creada: ${acc.code} – ${acc.name}`);
        }
        else {
            console.log(`↷ Cuenta ya existente: ${acc.code}`);
        }
    }
    console.log('🎉 Catálogo contable actualizado correctamente.');
    process.exit();
}
seed();
