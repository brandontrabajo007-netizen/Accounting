// Application use-cases/services
import { makeOnAccountingPeriodClosedCreateClosingEntry } from '@application/accounting-periods/handlers/onAccountingPeriodClosedCreateClosingEntry'
import { makeOnAccountingPeriodClosedCreateLedgerSnapshot } from '@application/accounting-periods/handlers/onAccountingPeriodClosedCreateLedgerSnapshot'
import { makePeriodAccessGuard } from '@application/accounting-periods/services/PeriodAccessGuard'
import { makeResolvePeriodId } from '@application/accounting-periods/services/resolvePeriodId'
import { makeProcessJournalEntry } from '@application/journal/use-cases/processJournalEntry'
import { makeAccountsPayableOrchestrator } from '@accounts-payable/application/use-cases/makeAccountsPayableOrchestrator'
import { makeAccountsReceivableOrchestrator } from '@accounts-receivable/application/use-cases/makeAccountsReceivableOrchestrator'
import { makeRegisterCustomerHistory } from '@accounts-receivable/application/use-cases/registerCustomerHistory'
import { makeRegisterSupplierHistory } from '@supplier-history/application/use-cases/registerSupplierHistory'

// Infrastructure: core repositories/services
import { MongoLedgerPoster } from '@infra/journal/MongoLedgerPoster'
import { makeInMemoryDomainEventBus } from '@infra/events/makeInMemoryDomainEventBus'
import { pdfkitReportPdfGenerator } from '@infra/pdf/pdfkitReportPdfGenerator'
import { makeMongoTransactionRunner } from '@infra/persistence/mongo/TransactionRunnerMongo'
import { MongoAccountRepository } from '@infra/persistence/mongo/repositories/MongoAccountRepository'
import { MongoCustomerPaymentAccountMappingRepository } from '@infra/persistence/mongo/repositories/MongoCustomerPaymentAccountMappingRepository'
import { MongoIncomeStatementRepository } from '@infra/persistence/mongo/repositories/MongoIncomeStatementRepository'
import { MongoJournalEntryRepository } from '@infra/persistence/mongo/repositories/MongoJournalEntryRepository'
import { MongoLedgerMovementRepository } from '@infra/persistence/mongo/repositories/MongoLedgerMovementRepository'
import { MongoPayrollAccountMappingRepository } from '@infra/persistence/mongo/repositories/MongoPayrollAccountMappingRepository'
import { MongoPendingEventRepository } from '@infra/persistence/mongo/repositories/MongoPendingEventRepository'
import { MongoPurchaseAccountMappingRepository } from '@infra/persistence/mongo/repositories/MongoPurchaseAccountMappingRepository'
import { MongoSaleAccountMappingRepository } from '@infra/persistence/mongo/repositories/MongoSaleAccountMappingRepository'
import { MongoSupplierPaymentAccountMappingRepository } from '@infra/persistence/mongo/repositories/MongoSupplierPaymentAccountMappingRepository'
import { MongoUserRepository } from '@infra/persistence/mongo/repositories/MongoUserRepository'
import { makeMongoAccountingPeriodRepository } from '@infra/persistence/mongo/repositories/makeMongoAccountingPeriodRepository'
import { makeMongoLedgerSnapshotRepository } from '@infra/persistence/mongo/repositories/makeMongoLedgerSnapshotRepository'
import { makeMongoPeriodResultRepository } from '@infra/persistence/mongo/repositories/makeMongoPeriodResultRepository'

// Accounts Receivable
import { MongoArCustomerRepository } from '@accounts-receivable/infrastructure/persistence/mongo/repositories/MongoArCustomerRepository'
import { MongoArEntryRepository } from '@accounts-receivable/infrastructure/persistence/mongo/repositories/MongoArEntryRepository'
import { MongoArSettingsRepository } from '@accounts-receivable/infrastructure/persistence/mongo/repositories/MongoArSettingsRepository'
import { MongoCustomerHistoryRepository } from '@accounts-receivable/infrastructure/persistence/mongo/repositories/MongoCustomerHistoryRepository'

// Accounts Payable
import { MongoApEntryRepository } from '@accounts-payable/infrastructure/persistence/mongo/repositories/MongoApEntryRepository'
import { MongoApSettingsRepository } from '@accounts-payable/infrastructure/persistence/mongo/repositories/MongoApSettingsRepository'
import { MongoApSupplierRepository } from '@accounts-payable/infrastructure/persistence/mongo/repositories/MongoApSupplierRepository'

// Supplier history
import { MongoSupplierHistoryRepository } from '@supplier-history/infrastructure/persistence/mongo/repositories/MongoSupplierHistoryRepository'

// ------------------------------------
// SINGLETONS
// ------------------------------------
// Core repositories
export const accountRepository = new MongoAccountRepository()
export const saleAccountMappingRepository = new MongoSaleAccountMappingRepository()
export const journalEntryRepository = new MongoJournalEntryRepository()
export const userRepository = new MongoUserRepository()
export const purchaseAccountMappingRepository = new MongoPurchaseAccountMappingRepository()
export const payrollAccountMappingRepository = new MongoPayrollAccountMappingRepository()
export const customerPaymentAccountMappingRepository = new MongoCustomerPaymentAccountMappingRepository()
export const supplierPaymentAccountMappingRepository = new MongoSupplierPaymentAccountMappingRepository()

// Accounts Receivable
export const arCustomerRepository = new MongoArCustomerRepository()
export const arEntryRepository = new MongoArEntryRepository()
export const arSettingsRepository = new MongoArSettingsRepository()

// Accounts Payable
export const apSupplierRepository = new MongoApSupplierRepository()
export const apEntryRepository = new MongoApEntryRepository()
export const apSettingsRepository = new MongoApSettingsRepository()

// Customer/Supplier history
export const customerHistoryRepository = new MongoCustomerHistoryRepository()
export const customerHistoryService = makeRegisterCustomerHistory({
  customerRepository: arCustomerRepository,
  customerHistoryRepository,
})
export const supplierHistoryRepository = new MongoSupplierHistoryRepository()
export const supplierHistoryService = makeRegisterSupplierHistory({
  supplierRepository: apSupplierRepository,
  supplierHistoryRepository,
})
export const pendingEventRepository = new MongoPendingEventRepository()

// Contabilidad
export const ledgerPoster = new MongoLedgerPoster(accountRepository)
export const incomeStatementRepository = new MongoIncomeStatementRepository()
export const accountingPeriodRepository = makeMongoAccountingPeriodRepository()
export const periodResultRepository = makeMongoPeriodResultRepository()
export const ledgerSnapshotRepository = makeMongoLedgerSnapshotRepository()
export const transactionRunner = makeMongoTransactionRunner()
export const ledgerMovementRepository = new MongoLedgerMovementRepository()
export const periodAccessGuard = makePeriodAccessGuard(accountingPeriodRepository)
export const resolvePeriodId = makeResolvePeriodId(accountingPeriodRepository)
export const reportPdfGenerator = pdfkitReportPdfGenerator()

// Orchestrators
export const accountsReceivableOrchestrator = makeAccountsReceivableOrchestrator({
  customerRepository: arCustomerRepository,
  arEntryRepository,
  settingsRepository: arSettingsRepository,
})
export const accountsPayableOrchestrator = makeAccountsPayableOrchestrator({
  supplierRepository: apSupplierRepository,
  apEntryRepository,
  settingsRepository: apSettingsRepository,
})

// Domain events
const equityAccountCode = Number(process.env.EQUITY_ACCOUNT_CODE ?? 3605)
const closingEntryHandler = makeOnAccountingPeriodClosedCreateClosingEntry({
  journalEntryRepository,
  accountRepository,
  ledgerPoster,
  equityAccountCode,
})
const ledgerSnapshotHandler = makeOnAccountingPeriodClosedCreateLedgerSnapshot({
  ledgerSnapshotRepository,
  accountRepository,
  accountingPeriodRepository,
  journalEntryRepository,
})
export const domainEventBus = makeInMemoryDomainEventBus([closingEntryHandler, ledgerSnapshotHandler])

// Use cases
export const processJournalEntry = makeProcessJournalEntry(journalEntryRepository, ledgerPoster, periodAccessGuard)
