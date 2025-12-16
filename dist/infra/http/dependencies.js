"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processJournalEntry = exports.ledgerPoster = exports.payrollAccountMappingRepository = exports.ledgerBalanceRepository = exports.purchaseAccountMappingRepository = exports.userRepository = exports.journalEntryRepository = exports.saleAccountMappingRepository = exports.accountRepository = void 0;
const processJournalEntry_1 = require("@application/journal/use-cases/processJournalEntry");
// Nuevos
const MongoLedgerPoster_1 = require("@infra/journal/MongoLedgerPoster");
const MongoAccountRepository_1 = require("@infra/persistence/mongo/repositories/MongoAccountRepository");
const MongoJournalEntryRepository_1 = require("@infra/persistence/mongo/repositories/MongoJournalEntryRepository");
const MongoLedgerBalanceRepository_1 = require("@infra/persistence/mongo/repositories/MongoLedgerBalanceRepository");
const MongoPayrollAccountMappingRepository_1 = require("@infra/persistence/mongo/repositories/MongoPayrollAccountMappingRepository");
const MongoPurchaseAccountMappingRepository_1 = require("@infra/persistence/mongo/repositories/MongoPurchaseAccountMappingRepository");
const MongoSaleAccountMappingRepository_1 = require("@infra/persistence/mongo/repositories/MongoSaleAccountMappingRepository");
const MongoUserRepository_1 = require("@infra/persistence/mongo/repositories/MongoUserRepository");
// ------------------------------------
// SINGLETONS
// ------------------------------------
exports.accountRepository = new MongoAccountRepository_1.MongoAccountRepository();
exports.saleAccountMappingRepository = new MongoSaleAccountMappingRepository_1.MongoSaleAccountMappingRepository();
exports.journalEntryRepository = new MongoJournalEntryRepository_1.MongoJournalEntryRepository();
exports.userRepository = new MongoUserRepository_1.MongoUserRepository();
exports.purchaseAccountMappingRepository = new MongoPurchaseAccountMappingRepository_1.MongoPurchaseAccountMappingRepository();
exports.ledgerBalanceRepository = new MongoLedgerBalanceRepository_1.MongoLedgerBalanceRepository();
exports.payrollAccountMappingRepository = new MongoPayrollAccountMappingRepository_1.MongoPayrollAccountMappingRepository();
// Contabilidad
exports.ledgerPoster = new MongoLedgerPoster_1.MongoLedgerPoster(exports.accountRepository, exports.ledgerBalanceRepository);
exports.processJournalEntry = (0, processJournalEntry_1.makeProcessJournalEntry)(exports.journalEntryRepository, exports.ledgerPoster);
