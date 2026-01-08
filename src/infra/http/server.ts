// 👇 PRIMERA LÍNEA, OBLIGATORIA
import '@bootstrap/env'

import { connectToMongo } from '@infra/persistence/mongo/connect'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'

import authRoutes from './routes/auth.routes'
import { journalEntryRoutes } from './routes/journalEntry.routes'
import { ledgerRoutes } from './routes/ledger.routes'
import { payrollRoutes } from './routes/payroll.routes'
import { purchaseRoutes } from './routes/purchase.routes'
import { reportRoutes } from './routes/reports.routes'
import { saleRoutes } from './routes/sale.routes'
import { telegramRoutes } from './routes/telegram.routes'
import { userRoutes } from './routes/user.routes'
import { accountingPeriodRoutes } from './routes/accountingPeriod.routes'
import { accountRoutes } from './routes/account.routes'
import { arRoutes } from './routes/ar.routes'
import { apRoutes } from './routes/ap.routes'

const app = express()

app.use(express.json())
const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests sin origin (Postman, Telegram, server-to-server)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error(`CORS bloqueado para el origen: ${origin}`), false)
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
)
app.use(cookieParser())
app.use(bodyParser.json())

// --------------------
// Rutas HTTP
// --------------------
app.use('/', saleRoutes)
app.use('/', accountingPeriodRoutes)
app.use('/', accountRoutes)
app.use('/reports', reportRoutes)
app.use('/users', userRoutes)
app.use('/auth', authRoutes)
app.use('/telegram', telegramRoutes)
app.use('/ledger', ledgerRoutes)
app.use('/', purchaseRoutes)
app.use('/', payrollRoutes)
app.use('/', journalEntryRoutes)
app.use('/', arRoutes)
app.use('/', apRoutes)

// --------------------
// Bootstrap app
// --------------------
;(async () => {
  try {
    await connectToMongo()

    const PORT = Number(process.env.PORT ?? 3000)

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log('🟢 MongoDB conectado correctamente')
      console.log('🤖 Telegram webhook disponible en /telegram/webhook')
    })
  } catch (err) {
    console.error('🔴 No se pudo iniciar el servidor:', err)
    process.exit(1)
  }
})()
