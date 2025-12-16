export interface ProcessJournalEntry {
  process(entryId: string): Promise<void>
}
