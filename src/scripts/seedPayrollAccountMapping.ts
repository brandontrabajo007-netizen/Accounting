import { connectToMongo } from '../infra/persistence/mongo/connect'
import { PayrollAccountMappingModel } from '../infra/persistence/mongo/models/PayrollAccountMapping.model'

async function seed() {
  await connectToMongo()

  const companyId = 'sahet'

  // Verificar si ya existe para evitar duplicados
  const exists = await PayrollAccountMappingModel.findOne({ companyId })

  if (exists) {
    console.log(`↷ PayrollAccountMapping ya existe para companyId: ${companyId}`)
    process.exit(0)
  }

  await PayrollAccountMappingModel.create({
    companyId,
    expenseAccount: 5105, // Gastos de personal / Nómina
    cashAccount: 1105, // Caja general
    bankAccount: 1110, // Bancos
  })

  console.log('✔ PayrollAccountMapping creado correctamente')
  process.exit()
}

seed()
