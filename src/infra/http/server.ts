import { connectToMongo } from '@infra/persistence/mongo/connect'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/auth.routes' // 👈 NUEVO
import { journalEntryRoutes } from './routes/journalEntry.routes'
import { ledgerRoutes } from './routes/ledger.routes'
import { payrollRoutes } from './routes/payroll.routes'
import { purchaseRoutes } from './routes/purchase.routes'
// Rutas
import { reportRoutes } from './routes/reports.routes'
import { saleRoutes } from './routes/sale.routes'
import { telegramRoutes } from './routes/telegram.routes'
import { userRoutes } from './routes/user.routes'

dotenv.config()

const app = express()
app.use(express.json())
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true, // <-- permite cookies
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
)
app.use(cookieParser())

app.use(bodyParser.json())

// Rutas HTTP
app.use('/', saleRoutes)
app.use('/reports', reportRoutes)
app.use('/users', userRoutes)
app.use('/auth', authRoutes) // 👈 **AQUÍ SE ACTIVA LA RUTA**
app.use('/telegram', telegramRoutes)
app.use('/ledger', ledgerRoutes)
app.use('/', purchaseRoutes)
app.use('/', payrollRoutes)
app.use('/', journalEntryRoutes)

;(async () => {
  try {
    await connectToMongo()

    const PORT = process.env.PORT ?? 3000

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log('🟢 MongoDB Atlas conectado correctamente')
      console.log('🤖 Telegram webhook disponible en /telegram/webhook')
    })
  } catch (err) {
    console.error('🔴 No se pudo iniciar el servidor:', err)
    process.exit(1)
  }
})()
