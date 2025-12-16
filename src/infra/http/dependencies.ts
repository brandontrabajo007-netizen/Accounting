import { makeProcessJournalEntry } from '@application/journal/use-cases/processJournalEntry'
// Nuevos
import { MongoLedgerPoster } from '@infra/journal/MongoLedgerPoster'
import { MongoAccountRepository } from '@infra/persistence/mongo/repositories/MongoAccountRepository'
import { MongoJournalEntryRepository } from '@infra/persistence/mongo/repositories/MongoJournalEntryRepository'
import { MongoLedgerBalanceRepository } from '@infra/persistence/mongo/repositories/MongoLedgerBalanceRepository'
import { MongoPayrollAccountMappingRepository } from '@infra/persistence/mongo/repositories/MongoPayrollAccountMappingRepository'
import { MongoPurchaseAccountMappingRepository } from '@infra/persistence/mongo/repositories/MongoPurchaseAccountMappingRepository'
import { MongoSaleAccountMappingRepository } from '@infra/persistence/mongo/repositories/MongoSaleAccountMappingRepository'
import { MongoUserRepository } from '@infra/persistence/mongo/repositories/MongoUserRepository'

// ------------------------------------
// SINGLETONS
// ------------------------------------
export const accountRepository = new MongoAccountRepository()
export const saleAccountMappingRepository = new MongoSaleAccountMappingRepository()
export const journalEntryRepository = new MongoJournalEntryRepository()
export const userRepository = new MongoUserRepository()
export const purchaseAccountMappingRepository = new MongoPurchaseAccountMappingRepository()
export const ledgerBalanceRepository = new MongoLedgerBalanceRepository()
export const payrollAccountMappingRepository = new MongoPayrollAccountMappingRepository()
// Contabilidad
export const ledgerPoster = new MongoLedgerPoster(accountRepository, ledgerBalanceRepository)

export const processJournalEntry = makeProcessJournalEntry(journalEntryRepository, ledgerPoster)
