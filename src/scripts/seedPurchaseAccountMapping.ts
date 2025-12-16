import { connectToMongo } from '../infra/persistence/mongo/connect'
import { PurchaseAccountMappingModel } from '../infra/persistence/mongo/models/PurchaseAccountMapping.model'

async function seed() {
  await connectToMongo()

  const companyId = 'sahet'

  // Antes de crear, verificar si ya existe
  const exists = await PurchaseAccountMappingModel.findOne({ companyId })

  if (exists) {
    console.log(`↷ PurchaseAccountMapping ya existe para companyId: ${companyId}`)
    process.exit(0)
  }

  await PurchaseAccountMappingModel.create({
    companyId,
    vatAccount: 2402, // IVA descontable
    cashAccount: 1105, // Caja general
    bankAccount: 1110, // Bancos
    accountsPayableAccount: 2205, // Proveedores
  })

  console.log('✔ PurchaseAccountMapping creado correctamente')
  process.exit()
}

seed()
