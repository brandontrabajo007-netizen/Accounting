"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = require("../infra/persistence/mongo/connect");
const dependencies_1 = require("../infra/http/dependencies");
const EventType_enum_1 = require("../domain/events/EventType.enum");
const journalEntry_model_1 = require("../infra/persistence/mongo/models/journalEntry.model");
const saleAccountMapping_model_1 = require("../infra/persistence/mongo/models/saleAccountMapping.model");
const account_model_1 = require("../infra/persistence/mongo/models/account.model");
const CustomerHistoryModel_1 = require("../accounts-receivable/infrastructure/persistence/mongo/models/CustomerHistoryModel");
const normalize = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
const hasBankKeyword = (value) => {
    if (!value)
        return false;
    const text = normalize(value);
    return /(banco|transferencia|transfer|tarjeta|nequi|daviplata|pse)/.test(text);
};
const parseDateOnly = (value, bound) => {
    const raw = value.trim();
    const withTime = /^\d{4}-\d{2}-\d{2}$/.test(raw)
        ? bound === 'from'
            ? `${raw}T00:00:00.000Z`
            : `${raw}T23:59:59.999Z`
        : raw;
    const date = new Date(withTime);
    if (Number.isNaN(date.getTime()))
        throw new Error(`Fecha invalida: ${value}`);
    return date;
};
const readArgs = () => {
    const args = process.argv.slice(2);
    const byKey = new Map();
    let apply = false;
    for (const arg of args) {
        if (arg === '--apply') {
            apply = true;
            continue;
        }
        const match = arg.match(/^--([^=]+)=(.+)$/);
        if (match)
            byKey.set(match[1], match[2]);
    }
    const companyId = byKey.get('companyId')?.trim();
    if (!companyId) {
        throw new Error('Falta --companyId=<id_empresa>');
    }
    const from = byKey.get('from') ? parseDateOnly(byKey.get('from'), 'from') : undefined;
    const to = byKey.get('to') ? parseDateOnly(byKey.get('to'), 'to') : undefined;
    if (from && to && to < from) {
        throw new Error('Rango invalido: --to debe ser mayor o igual a --from');
    }
    return { companyId, from, to, apply };
};
const loadTransferSaleEntryIdsFromCustomerHistory = async (companyId, from, to) => {
    const filter = {
        companyId,
        type: 'sale',
        journalEntryId: { $exists: true, $ne: null },
    };
    if (from || to) {
        const dateFilter = {};
        if (from)
            dateFilter.$gte = from;
        if (to)
            dateFilter.$lte = to;
        filter.date = dateFilter;
    }
    const docs = await CustomerHistoryModel_1.CustomerHistoryMongoModel.find(filter).select({ journalEntryId: 1, paymentMethod: 1 }).lean().exec();
    const ids = new Set();
    for (const doc of docs) {
        const paymentMethod = typeof doc.paymentMethod === 'string' ? doc.paymentMethod : null;
        const journalEntryId = typeof doc.journalEntryId === 'string' ? doc.journalEntryId.trim() : '';
        if (!journalEntryId)
            continue;
        if (hasBankKeyword(paymentMethod)) {
            ids.add(journalEntryId);
        }
    }
    return ids;
};
const run = async () => {
    const args = readArgs();
    await (0, connect_1.connectToMongo)();
    const mapping = await saleAccountMapping_model_1.SaleAccountMappingModel.findOne({ companyId: args.companyId }).lean().exec();
    if (!mapping)
        throw new Error(`No existe SaleAccountMapping para companyId "${args.companyId}"`);
    const cashAccount = Number(mapping.cashAccount ?? 0);
    const bankAccount = Number(mapping.bankAccount ?? 0);
    if (!cashAccount)
        throw new Error('SaleAccountMapping.cashAccount es requerido');
    if (!bankAccount)
        throw new Error('SaleAccountMapping.bankAccount es requerido para esta correccion');
    if (cashAccount === bankAccount)
        throw new Error('cashAccount y bankAccount no pueden ser iguales');
    const bankAccountDoc = await account_model_1.AccountModel.findOne({ code: bankAccount }).select({ name: 1 }).lean().exec();
    if (!bankAccountDoc?.name)
        throw new Error(`No existe cuenta contable para bankAccount=${bankAccount}`);
    const bankAccountName = String(bankAccountDoc.name);
    const transferByHistory = await loadTransferSaleEntryIdsFromCustomerHistory(args.companyId, args.from, args.to);
    const query = {
        companyId: args.companyId,
        eventType: EventType_enum_1.EventType.SALE,
    };
    if (args.from || args.to) {
        const dateFilter = {};
        if (args.from)
            dateFilter.$gte = args.from;
        if (args.to)
            dateFilter.$lte = args.to;
        query.date = dateFilter;
    }
    const entries = await journalEntry_model_1.JournalEntryModel.find(query).sort({ date: 1 }).lean().exec();
    let reviewed = 0;
    let candidates = 0;
    let updated = 0;
    let skippedClosed = 0;
    let skippedNoEvidence = 0;
    let skippedNoCashMovement = 0;
    for (const rawEntry of entries) {
        reviewed += 1;
        const entry = rawEntry;
        const entryId = String(entry.id ?? '').trim();
        if (!entryId)
            continue;
        const byHistory = transferByHistory.has(entryId);
        const byDescription = hasBankKeyword(entry.description);
        const isTransferLike = byHistory || byDescription;
        if (!isTransferLike) {
            skippedNoEvidence += 1;
            continue;
        }
        const nextMovements = entry.movements.map((movement) => {
            const shouldMoveToBank = movement.accountCode === cashAccount &&
                movement.type === 'debit' &&
                movement.amount > 0 &&
                (movement.group === 'REVENUE' || movement.group === 'MAIN');
            if (!shouldMoveToBank)
                return movement;
            return {
                ...movement,
                accountCode: bankAccount,
                accountName: bankAccountName,
            };
        });
        const changed = nextMovements.some((m, index) => m.accountCode !== entry.movements[index].accountCode);
        if (!changed) {
            skippedNoCashMovement += 1;
            continue;
        }
        candidates += 1;
        if (!args.apply)
            continue;
        const updatedEntry = {
            ...entry,
            movements: nextMovements,
        };
        try {
            await dependencies_1.processJournalEntry.processEntry(updatedEntry, entry);
            updated += 1;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (/period/i.test(message) && /open|cerrado|closed/i.test(message)) {
                skippedClosed += 1;
                continue;
            }
            throw new Error(`Error corrigiendo asiento ${entryId}: ${message}`);
        }
    }
    console.log('--- Resultado ---');
    console.log(`Empresa: ${args.companyId}`);
    console.log(`Rango: ${args.from ? args.from.toISOString() : 'sin limite'} -> ${args.to ? args.to.toISOString() : 'sin limite'}`);
    console.log(`Modo: ${args.apply ? 'APPLY' : 'DRY RUN'}`);
    console.log(`Asientos revisados: ${reviewed}`);
    console.log(`Candidatos detectados: ${candidates}`);
    console.log(`Actualizados: ${updated}`);
    console.log(`Saltados por periodo cerrado: ${skippedClosed}`);
    console.log(`Saltados sin evidencia de transferencia: ${skippedNoEvidence}`);
    console.log(`Saltados sin debito en caja para mover: ${skippedNoCashMovement}`);
};
run()
    .then(() => process.exit(0))
    .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
});
