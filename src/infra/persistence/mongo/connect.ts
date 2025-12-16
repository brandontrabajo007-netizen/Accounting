import dotenv from 'dotenv'

dotenv.config()

import mongoose from 'mongoose'

export async function connectToMongo() {
  try {
    const mongoUri = process.env.MONGO_URI
    const mongoDbName = process.env.MONGO_DB_NAME

    if (!mongoUri) {
      throw new Error('❌ MONGO_URI no está definida en el archivo .env')
    }

    if (!mongoDbName) {
      throw new Error('❌ MONGO_DB_NAME no está definida en el archivo .env')
    }

    await mongoose.connect(mongoUri, { dbName: mongoDbName })

    console.log('🟢 MongoDB conectado correctamente')
  } catch (err) {
    console.error('🔴 Error conectando a MongoDB:', err)
    process.exit(1)
  }
}
