import mongoose from 'mongoose'
import type { TransactionRunner } from '@application/accounting-periods/ports/TransactionRunner'

export const makeMongoTransactionRunner = (): TransactionRunner => ({
  runInTransaction: async (operation) => {
    const session = await mongoose.startSession()
    try {
      let result: any
      await session.withTransaction(async () => {
        result = await operation()
      })
      return result
    } finally {
      await session.endSession()
    }
  },
})
