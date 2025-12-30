import { makeProcessJournalEntry } from '@application/journal/use-cases/processJournalEntry'
import { makePeriodAccessGuard } from '@application/accounting-periods/services/PeriodAccessGuard'
// Nuevos
import { MongoLedgerPoster } from '@infra/journal/MongoLedgerPoster'
import { MongoAccountRepository } from '@infra/persistence/mongo/repositories/MongoAccountRepository'
import { MongoIncomeStatementRepository } from '@infra/persistence/mongo/repositories/MongoIncomeStatementRepository'
import { MongoJournalEntryRepository } from '@infra/persistence/mongo/repositories/MongoJournalEntryRepository'
import { MongoPayrollAccountMappingRepository } from '@infra/persistence/mongo/repositories/MongoPayrollAccountMappingRepository'
import { MongoPurchaseAccountMappingRepository } from '@infra/persistence/mongo/repositories/MongoPurchaseAccountMappingRepository'
import { MongoLedgerMovementRepository } from '@infra/persistence/mongo/repositories/MongoLedgerMovementRepository'
import { MongoSaleAccountMappingRepository } from '@infra/persistence/mongo/repositories/MongoSaleAccountMappingRepository'
import { MongoUserRepository } from '@infra/persistence/mongo/repositories/MongoUserRepository'
import { makeMongoAccountingPeriodRepository } from '@infra/persistence/mongo/repositories/makeMongoAccountingPeriodRepository'
import { makeMongoPeriodResultRepository } from '@infra/persistence/mongo/repositories/makeMongoPeriodResultRepository'
import { makeMongoLedgerSnapshotRepository } from '@infra/persistence/mongo/repositories/makeMongoLedgerSnapshotRepository'
import { makeMongoTransactionRunner } from '@infra/persistence/mongo/TransactionRunnerMongo'
import { makeInMemoryDomainEventBus } from '@infra/events/makeInMemoryDomainEventBus'
import { makeOnAccountingPeriodClosedCreateLedgerSnapshot } from '@application/accounting-periods/handlers/onAccountingPeriodClosedCreateLedgerSnapshot'
import { makeOnAccountingPeriodClosedCreateClosingEntry } from '@application/accounting-periods/handlers/onAccountingPeriodClosedCreateClosingEntry'
import { makeResolvePeriodId } from '@application/accounting-periods/services/resolvePeriodId'
import { pdfkitReportPdfGenerator } from '@infra/pdf/pdfkitReportPdfGenerator'

// ------------------------------------
// SINGLETONS
// ------------------------------------
export const accountRepository = new MongoAccountRepository()
export const saleAccountMappingRepository = new MongoSaleAccountMappingRepository()
export const journalEntryRepository = new MongoJournalEntryRepository()
export const userRepository = new MongoUserRepository()
export const purchaseAccountMappingRepository = new MongoPurchaseAccountMappingRepository()
export const payrollAccountMappingRepository = new MongoPayrollAccountMappingRepository()
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
export const processJournalEntry = makeProcessJournalEntry(journalEntryRepository, ledgerPoster, periodAccessGuard)
