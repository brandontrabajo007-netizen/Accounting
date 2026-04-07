import type { AccountingPeriodRepository } from '@application/accounting-periods/ports/AccountingPeriodRepository'
import type { LedgerMovementRepository } from '@application/shared/ports/LedgerMovementRepository'
import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import { AccountType } from '@domain/accounts/AccountType'

type Dependencies = {
  ledgerMovementRepository: LedgerMovementRepository
  accountRepository: AccountRepository
  accountingPeriodRepository: AccountingPeriodRepository
}

type Input = {
  companyId: string
  accountCode: number
  periodId?: string
  from?: Date
  to?: Date
  page?: number
  limit?: number
  includeRunningBalance?: boolean
}

export const makeListAccountMovements = ({ ledgerMovementRepository, accountRepository, accountingPeriodRepository }: Dependencies) => ({
  execute: async ({ companyId, accountCode, periodId, from, to, page = 1, limit = 50, includeRunningBalance = true }: Input) => {
    const account = await accountRepository.getByCode(accountCode)

    let periodStart: Date | undefined
    let periodEnd: Date | undefined
    if (periodId) {
      const period = await accountingPeriodRepository.findById(periodId)
      if (!period) throw new Error('Periodo no encontrado')
      if (period.companyId !== companyId) throw new Error('El periodo no pertenece a la empresa')
      periodStart = period.start
      periodEnd = period.end
    }

    const clampedFrom = from ?? periodStart
    const clampedTo = to ?? periodEnd

    if (clampedFrom && clampedTo && clampedTo < clampedFrom) {
      throw new Error('El rango de fechas es inválido')
    }

    const safePage = Math.max(1, page)
    const safeLimit = Math.min(Math.max(limit, 1), 200)

    const increaseIsDebit = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE
    const net = (debit: number, credit: number) => (increaseIsDebit ? debit - credit : credit - debit)

    const list = await ledgerMovementRepository.findByAccount({
      companyId,
      accountCode,
      periodId,
      from: clampedFrom,
      to: clampedTo,
      page: safePage,
      limit: safeLimit,
    })

    let openingBeforeRange = { debit: 0, credit: 0 }
    if (includeRunningBalance && clampedFrom) {
      openingBeforeRange = await ledgerMovementRepository.sumBefore({
        companyId,
        accountCode,
        periodId,
        from: clampedFrom,
        to: clampedTo,
        before: clampedFrom,
      })
    }

    let opening = openingBeforeRange
    if (includeRunningBalance && safePage > 1) {
      const firstMovement = list.items[0]
      if (firstMovement) {
        const beforeCurrentPage = await ledgerMovementRepository.sumBeforeCursor({
          companyId,
          accountCode,
          periodId,
          from: clampedFrom,
          to: clampedTo,
          cursor: {
            date: firstMovement.date,
            createdAt: firstMovement.createdAt ?? firstMovement.date,
            id: firstMovement.id,
          },
        })
        opening = {
          debit: openingBeforeRange.debit + beforeCurrentPage.debit,
          credit: openingBeforeRange.credit + beforeCurrentPage.credit,
        }
      } else if (list.total > 0) {
        // Si la página quedó fuera de rango, tomamos el acumulado total del rango filtrado.
        opening = {
          debit: openingBeforeRange.debit + list.totals.debit,
          credit: openingBeforeRange.credit + list.totals.credit,
        }
      }
    }

    const initialBalance = includeRunningBalance ? net(opening.debit, opening.credit) : 0
    let runningBalance = initialBalance

    const items = list.items.map((movement) => {
      const delta = net(movement.debit, movement.credit)
      if (includeRunningBalance) {
        runningBalance += delta
      }

      return {
        ...movement,
        balanceAfter: includeRunningBalance ? runningBalance : undefined,
      }
    })

    const pageFinalBalance = includeRunningBalance ? runningBalance : undefined
    const finalBalance = includeRunningBalance
      ? net(openingBeforeRange.debit + list.totals.debit, openingBeforeRange.credit + list.totals.credit)
      : undefined

    return {
      account: {
        code: account.code,
        name: account.name,
        type: account.type,
      },
      filters: {
        periodId,
        from: clampedFrom,
        to: clampedTo,
      },
      pageInfo: {
        page: safePage,
        limit: safeLimit,
        total: list.total,
        hasMore: safePage * safeLimit < list.total,
      },
      totals: list.totals,
      initialBalance,
      pageFinalBalance,
      finalBalance,
      items,
    }
  },
})
