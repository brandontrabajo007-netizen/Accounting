import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import type { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { PaginatedResult } from './PaginatedResult'

export interface JournalEntryRepository {
  save(entry: JournalEntry): Promise<void>

  findById(id: string): Promise<JournalEntry | null>

  findByCompanyAndPeriod(companyId: string, start: Date, end: Date): Promise<JournalEntry[]>

  findByStatus(companyId: string, status: JournalEntryStatus): Promise<JournalEntry[]>

  deleteAllByCompany(companyId: string): Promise<void>

  /* -------------------------------------------
     🔥 NUEVO: Paginación + filtros
  ------------------------------------------- */
  findPaginated(params: { companyId: string; page: number; limit: number; search?: string; status?: JournalEntryStatus; from?: Date; to?: Date }): Promise<PaginatedResult<JournalEntry>>
}
