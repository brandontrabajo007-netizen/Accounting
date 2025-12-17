import { env } from '@config/env'
import mongoose from 'mongoose'

export async function connectToMongo() {
  try {
    await mongoose.connect(env.db.mongoUri, {
      dbName: env.db.mongoDbName,
    })

    console.log('🟢 MongoDB conectado correctamente')
  } catch (err) {
    console.error('🔴 Error conectando a MongoDB:', err)
    process.exit(1)
  }
}
