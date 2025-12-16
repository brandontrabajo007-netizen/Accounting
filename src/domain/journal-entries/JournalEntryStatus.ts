export enum JournalEntryStatus {
  CREATED = 'created',
  PENDING = 'pending',
  PROCESSED = 'processed',
}

export type JournalEntryStatusType = `${JournalEntryStatus}`
