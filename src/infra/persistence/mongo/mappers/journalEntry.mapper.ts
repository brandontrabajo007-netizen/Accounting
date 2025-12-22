import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import type { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { Movement } from '@domain/movements/Movement'
import type { MovementStatus } from '@domain/movements/MovementStatus'
import type { TransactionType } from '@domain/movements/TransactionType'
import type { JournalEntryDocument } from '../models/journalEntry.model'

// ----------------------
//  MOVEMENT MAPPERS
// ----------------------
const mapMovementFromMongo = (m: Movement): Movement => ({
  accountCode: m.accountCode,
  accountName: m.accountName,
  type: m.type as TransactionType,
  amount: m.amount,
  status: m.status as MovementStatus,
  group: m.group ?? 'MAIN',
})

const mapMovementToMongo = (m: Movement): Movement => ({
  accountCode: m.accountCode,
  accountName: m.accountName,
  type: m.type,
  amount: m.amount,
  status: m.status,
  group: m.group, // already required in Movement
})

// ----------------------
//  JOURNAL ENTRY
// ----------------------
export const mongoToJournalEntry = (doc: JournalEntryDocument): JournalEntry => ({
  id: doc.id,
  companyId: doc.companyId,
  journalNumber: doc.journalNumber,
  date: doc.date,
  description: doc.description,
  status: doc.status as JournalEntryStatus,
  movements: doc.movements.map(mapMovementFromMongo),
  eventType: doc.eventType,
})

export const journalEntryToMongo = (entry: JournalEntry) => ({
  id: entry.id,
  companyId: entry.companyId,
  journalNumber: entry.journalNumber,
  date: entry.date,
  description: entry.description,
  eventType: entry.eventType,
  status: entry.status,
  movements: entry.movements.map(mapMovementToMongo),
})
