"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryGateway = exports.processJournalEntry = exports.domainEventBus = exports.accountsPayableOrchestrator = exports.accountsReceivableOrchestrator = exports.reportPdfGenerator = exports.resolvePeriodId = exports.periodAccessGuard = exports.ledgerMovementRepository = exports.transactionRunner = exports.ledgerSnapshotRepository = exports.periodResultRepository = exports.accountingPeriodRepository = exports.incomeStatementRepository = exports.ledgerPoster = exports.pendingEventRepository = exports.supplierHistoryService = exports.supplierHistoryRepository = exports.customerHistoryService = exports.customerHistoryRepository = exports.apSettingsRepository = exports.apEntryRepository = exports.apSupplierRepository = exports.arSettingsRepository = exports.arEntryRepository = exports.arCustomerRepository = exports.invoiceIssuerSettingsRepository = exports.supplierPaymentAccountMappingRepository = exports.customerPaymentAccountMappingRepository = exports.payrollAccountMappingRepository = exports.purchaseAccountMappingRepository = exports.userRepository = exports.journalEntryRepository = exports.saleAccountMappingRepository = exports.accountRepository = void 0;
// Application use-cases/services
const onAccountingPeriodClosedCreateClosingEntry_1 = require("@application/accounting-periods/handlers/onAccountingPeriodClosedCreateClosingEntry");
const onAccountingPeriodClosedCreateLedgerSnapshot_1 = require("@application/accounting-periods/handlers/onAccountingPeriodClosedCreateLedgerSnapshot");
const PeriodAccessGuard_1 = require("@application/accounting-periods/services/PeriodAccessGuard");
const resolvePeriodId_1 = require("@application/accounting-periods/services/resolvePeriodId");
const processJournalEntry_1 = require("@application/journal/use-cases/processJournalEntry");
const makeAccountsPayableOrchestrator_1 = require("@accounts-payable/application/use-cases/makeAccountsPayableOrchestrator");
const makeAccountsReceivableOrchestrator_1 = require("@accounts-receivable/application/use-cases/makeAccountsReceivableOrchestrator");
const registerCustomerHistory_1 = require("@accounts-receivable/application/use-cases/registerCustomerHistory");
const registerSupplierHistory_1 = require("@supplier-history/application/use-cases/registerSupplierHistory");
// Infrastructure: core repositories/services
const MongoLedgerPoster_1 = require("@infra/journal/MongoLedgerPoster");
const makeInMemoryDomainEventBus_1 = require("@infra/events/makeInMemoryDomainEventBus");
const pdfkitReportPdfGenerator_1 = require("@infra/pdf/pdfkitReportPdfGenerator");
const TransactionRunnerMongo_1 = require("@infra/persistence/mongo/TransactionRunnerMongo");
const MongoAccountRepository_1 = require("@infra/persistence/mongo/repositories/MongoAccountRepository");
const MongoCustomerPaymentAccountMappingRepository_1 = require("@infra/persistence/mongo/repositories/MongoCustomerPaymentAccountMappingRepository");
const MongoIncomeStatementRepository_1 = require("@infra/persistence/mongo/repositories/MongoIncomeStatementRepository");
const MongoJournalEntryRepository_1 = require("@infra/persistence/mongo/repositories/MongoJournalEntryRepository");
const MongoLedgerMovementRepository_1 = require("@infra/persistence/mongo/repositories/MongoLedgerMovementRepository");
const MongoPayrollAccountMappingRepository_1 = require("@infra/persistence/mongo/repositories/MongoPayrollAccountMappingRepository");
const MongoPendingEventRepository_1 = require("@infra/persistence/mongo/repositories/MongoPendingEventRepository");
const MongoPurchaseAccountMappingRepository_1 = require("@infra/persistence/mongo/repositories/MongoPurchaseAccountMappingRepository");
const MongoSaleAccountMappingRepository_1 = require("@infra/persistence/mongo/repositories/MongoSaleAccountMappingRepository");
const MongoSupplierPaymentAccountMappingRepository_1 = require("@infra/persistence/mongo/repositories/MongoSupplierPaymentAccountMappingRepository");
const MongoUserRepository_1 = require("@infra/persistence/mongo/repositories/MongoUserRepository");
const MongoInvoiceIssuerSettingsRepository_1 = require("@infra/persistence/mongo/repositories/MongoInvoiceIssuerSettingsRepository");
const makeMongoAccountingPeriodRepository_1 = require("@infra/persistence/mongo/repositories/makeMongoAccountingPeriodRepository");
const makeMongoLedgerSnapshotRepository_1 = require("@infra/persistence/mongo/repositories/makeMongoLedgerSnapshotRepository");
const makeMongoPeriodResultRepository_1 = require("@infra/persistence/mongo/repositories/makeMongoPeriodResultRepository");
// Accounts Receivable
const MongoArCustomerRepository_1 = require("@accounts-receivable/infrastructure/persistence/mongo/repositories/MongoArCustomerRepository");
const MongoArEntryRepository_1 = require("@accounts-receivable/infrastructure/persistence/mongo/repositories/MongoArEntryRepository");
const MongoArSettingsRepository_1 = require("@accounts-receivable/infrastructure/persistence/mongo/repositories/MongoArSettingsRepository");
const MongoCustomerHistoryRepository_1 = require("@accounts-receivable/infrastructure/persistence/mongo/repositories/MongoCustomerHistoryRepository");
// Accounts Payable
const MongoApEntryRepository_1 = require("@accounts-payable/infrastructure/persistence/mongo/repositories/MongoApEntryRepository");
const MongoApSettingsRepository_1 = require("@accounts-payable/infrastructure/persistence/mongo/repositories/MongoApSettingsRepository");
const MongoApSupplierRepository_1 = require("@accounts-payable/infrastructure/persistence/mongo/repositories/MongoApSupplierRepository");
const ProductId_1 = require("@inventory/domain/value-objects/ProductId");
const dependencies_1 = require("@inventory/infrastructure/http/dependencies");
// Supplier history
const MongoSupplierHistoryRepository_1 = require("@supplier-history/infrastructure/persistence/mongo/repositories/MongoSupplierHistoryRepository");
// ------------------------------------
// SINGLETONS
// ------------------------------------
// Core repositories
exports.accountRepository = new MongoAccountRepository_1.MongoAccountRepository();
exports.saleAccountMappingRepository = new MongoSaleAccountMappingRepository_1.MongoSaleAccountMappingRepository();
exports.journalEntryRepository = new MongoJournalEntryRepository_1.MongoJournalEntryRepository();
exports.userRepository = new MongoUserRepository_1.MongoUserRepository();
exports.purchaseAccountMappingRepository = new MongoPurchaseAccountMappingRepository_1.MongoPurchaseAccountMappingRepository();
exports.payrollAccountMappingRepository = new MongoPayrollAccountMappingRepository_1.MongoPayrollAccountMappingRepository();
exports.customerPaymentAccountMappingRepository = new MongoCustomerPaymentAccountMappingRepository_1.MongoCustomerPaymentAccountMappingRepository();
exports.supplierPaymentAccountMappingRepository = new MongoSupplierPaymentAccountMappingRepository_1.MongoSupplierPaymentAccountMappingRepository();
exports.invoiceIssuerSettingsRepository = new MongoInvoiceIssuerSettingsRepository_1.MongoInvoiceIssuerSettingsRepository();
// Accounts Receivable
exports.arCustomerRepository = new MongoArCustomerRepository_1.MongoArCustomerRepository();
exports.arEntryRepository = new MongoArEntryRepository_1.MongoArEntryRepository();
exports.arSettingsRepository = new MongoArSettingsRepository_1.MongoArSettingsRepository();
// Accounts Payable
exports.apSupplierRepository = new MongoApSupplierRepository_1.MongoApSupplierRepository();
exports.apEntryRepository = new MongoApEntryRepository_1.MongoApEntryRepository();
exports.apSettingsRepository = new MongoApSettingsRepository_1.MongoApSettingsRepository();
// Customer/Supplier history
exports.customerHistoryRepository = new MongoCustomerHistoryRepository_1.MongoCustomerHistoryRepository();
exports.customerHistoryService = (0, registerCustomerHistory_1.makeRegisterCustomerHistory)({
    customerRepository: exports.arCustomerRepository,
    customerHistoryRepository: exports.customerHistoryRepository,
});
exports.supplierHistoryRepository = new MongoSupplierHistoryRepository_1.MongoSupplierHistoryRepository();
exports.supplierHistoryService = (0, registerSupplierHistory_1.makeRegisterSupplierHistory)({
    supplierRepository: exports.apSupplierRepository,
    supplierHistoryRepository: exports.supplierHistoryRepository,
});
exports.pendingEventRepository = new MongoPendingEventRepository_1.MongoPendingEventRepository();
// Contabilidad
exports.ledgerPoster = new MongoLedgerPoster_1.MongoLedgerPoster(exports.accountRepository);
exports.incomeStatementRepository = new MongoIncomeStatementRepository_1.MongoIncomeStatementRepository();
exports.accountingPeriodRepository = (0, makeMongoAccountingPeriodRepository_1.makeMongoAccountingPeriodRepository)();
exports.periodResultRepository = (0, makeMongoPeriodResultRepository_1.makeMongoPeriodResultRepository)();
exports.ledgerSnapshotRepository = (0, makeMongoLedgerSnapshotRepository_1.makeMongoLedgerSnapshotRepository)();
exports.transactionRunner = (0, TransactionRunnerMongo_1.makeMongoTransactionRunner)();
exports.ledgerMovementRepository = new MongoLedgerMovementRepository_1.MongoLedgerMovementRepository();
exports.periodAccessGuard = (0, PeriodAccessGuard_1.makePeriodAccessGuard)(exports.accountingPeriodRepository);
exports.resolvePeriodId = (0, resolvePeriodId_1.makeResolvePeriodId)(exports.accountingPeriodRepository);
exports.reportPdfGenerator = (0, pdfkitReportPdfGenerator_1.pdfkitReportPdfGenerator)();
// Orchestrators
exports.accountsReceivableOrchestrator = (0, makeAccountsReceivableOrchestrator_1.makeAccountsReceivableOrchestrator)({
    customerRepository: exports.arCustomerRepository,
    arEntryRepository: exports.arEntryRepository,
    settingsRepository: exports.arSettingsRepository,
});
exports.accountsPayableOrchestrator = (0, makeAccountsPayableOrchestrator_1.makeAccountsPayableOrchestrator)({
    supplierRepository: exports.apSupplierRepository,
    apEntryRepository: exports.apEntryRepository,
    settingsRepository: exports.apSettingsRepository,
});
// Domain events
const equityAccountCode = Number(process.env.EQUITY_ACCOUNT_CODE ?? 3605);
const closingEntryHandler = (0, onAccountingPeriodClosedCreateClosingEntry_1.makeOnAccountingPeriodClosedCreateClosingEntry)({
    journalEntryRepository: exports.journalEntryRepository,
    accountRepository: exports.accountRepository,
    ledgerPoster: exports.ledgerPoster,
    equityAccountCode,
});
const ledgerSnapshotHandler = (0, onAccountingPeriodClosedCreateLedgerSnapshot_1.makeOnAccountingPeriodClosedCreateLedgerSnapshot)({
    ledgerSnapshotRepository: exports.ledgerSnapshotRepository,
    accountRepository: exports.accountRepository,
    accountingPeriodRepository: exports.accountingPeriodRepository,
    journalEntryRepository: exports.journalEntryRepository,
});
exports.domainEventBus = (0, makeInMemoryDomainEventBus_1.makeInMemoryDomainEventBus)([closingEntryHandler, ledgerSnapshotHandler]);
// Use cases
exports.processJournalEntry = (0, processJournalEntry_1.makeProcessJournalEntry)(exports.journalEntryRepository, exports.ledgerPoster, exports.periodAccessGuard);
exports.inventoryGateway = {
    idGenerator: dependencies_1.idGenerator,
    listProducts: (input) => dependencies_1.productRepo.list(input),
    listVariantsByProductId: (companyId, productId) => dependencies_1.variantRepo.listByProductId(companyId, ProductId_1.ProductId.from(productId)),
    getReservationById: (companyId, reservationId) => dependencies_1.reservationRepo.getById(companyId, reservationId),
    getProductById: (companyId, productId) => dependencies_1.productRepo.getById(companyId, ProductId_1.ProductId.from(productId)),
    findSaleMovements: (companyId, saleId) => dependencies_1.movementRepo.findByReference(companyId, 'SALE', saleId),
    getSaleCost: dependencies_1.getSaleCost,
    confirmSale: dependencies_1.confirmSale,
    reverseSale: dependencies_1.reverseSale,
};
