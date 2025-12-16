"use strict";
// src/application/sales/use-cases/registerSale.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterSale = void 0;
const EventType_enum_1 = require("@domain/events/EventType.enum");
const generateSaleJournalEntry_1 = require("@domain/events/sale/generateSaleJournalEntry");
// Validaciones
const validateSaleAccount_1 = require("@domain/events/sale/validateSaleAccount");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
// Presentador
const presentJournalEntry_1 = require("../presenters/presentJournalEntry");
const makeRegisterSale = ({ accountRepository, saleAccountMappingRepository, journalEntryRepository, processJournalEntry }) => {
    const registerSale = async (input) => {
        // -------------------------------------------------------
        // 1️ NORMALIZACIÓN DE CAMPOS BÁSICOS
        // -------------------------------------------------------
        const date = input.date ? new Date(input.date) : new Date();
        const includesVAT = input.includesVAT ?? false;
        const includesCost = input.includesCost ?? false;
        // -------------------------------------------------------
        // 2️ COMPLETAR CAMPOS FALTANTES (REGLAS DE NEGOCIO)
        // -------------------------------------------------------
        let { totalAmount, unitPrice, quantity } = input;
        // Si falta quantity → no se puede continuar
        if (!quantity || quantity <= 0) {
            throw new Error('No se puede registrar la venta: falta la cantidad.');
        }
        // Si falta unitPrice pero sí hay totalAmount → calcular unitPrice
        if (!unitPrice && totalAmount != null) {
            unitPrice = Math.round(totalAmount / quantity);
        }
        // Si falta totalAmount pero sí hay unitPrice → calcular totalAmount
        if (totalAmount == null && unitPrice != null) {
            totalAmount = quantity * unitPrice;
        }
        // Después de intentar completar, validar
        if (unitPrice == null || totalAmount == null) {
            throw new Error('No se puede registrar la venta: faltan datos de precio (unitPrice o totalAmount).');
        }
        // -------------------------------------------------------
        // 3️ VALIDACIONES FINALES
        // -------------------------------------------------------
        if (!input.description || typeof input.description !== 'string') {
            throw new Error('Description is required and must be a string.');
        }
        if (includesCost && (!input.unitCost || input.unitCost <= 0)) {
            throw new Error('includesCost=true pero no se proporcionó unitCost válido.');
        }
        // -------------------------------------------------------
        // 4️ OBTENER CONFIG CONTABLE
        // -------------------------------------------------------
        const accountsCatalog = await accountRepository.getAll();
        const accountMapping = await saleAccountMappingRepository.getSaleAccountMappingByCompanyId(input.companyId);
        // -------------------------------------------------------
        // 5️ MAPEO A EVENTO DE DOMINIO
        // -------------------------------------------------------
        const saleEvent = {
            type: EventType_enum_1.EventType.SALE,
            companyId: input.companyId,
            description: input.description,
            totalAmount,
            amount: includesVAT ? Math.round(totalAmount / 1.19) : totalAmount,
            date,
            includesVAT,
            includesCost,
            quantity,
            unitCost: input.unitCost,
            unitPrice,
            toJournalEntry: (config) => (0, generateSaleJournalEntry_1.generateSaleJournalEntry)(saleEvent, config, accountsCatalog),
        };
        // -------------------------------------------------------
        // 6️ VALIDAR CONFIG PROPORCIONADA
        // -------------------------------------------------------
        (0, validateSaleAccount_1.validateSaleAccount)(accountMapping, accountsCatalog, saleEvent);
        // -------------------------------------------------------
        // 7️ GENERAR ASIENTO
        // -------------------------------------------------------
        let journalEntry = (0, generateSaleJournalEntry_1.generateSaleJournalEntry)(saleEvent, accountMapping, accountsCatalog);
        // Asiento nace en estado CREATED
        journalEntry = {
            ...journalEntry,
            status: JournalEntryStatus_1.JournalEntryStatus.CREATED,
        };
        // -------------------------------------------------------
        // 8️ GUARDAR ASIENTO
        // -------------------------------------------------------
        await journalEntryRepository.save(journalEntry);
        // -------------------------------------------------------
        // 9️ AUTOMATIZACIÓN: PROCESAR ASIENTO
        // -------------------------------------------------------
        // Procesamos automáticamente para actualizar saldos y estados
        journalEntry = await processJournalEntry.process(journalEntry.id);
        // -------------------------------------------------------
        // 10 PRESENTAR RESULTADO AL FRONT/TELEGRAM
        // -------------------------------------------------------
        return (0, presentJournalEntry_1.presentJournalEntry)(journalEntry, accountsCatalog);
    };
    return { registerSale };
};
exports.makeRegisterSale = makeRegisterSale;
