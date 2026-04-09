import { connectToMongo } from '../infra/persistence/mongo/connect'
import { SaleAccountMappingModel } from '../infra/persistence/mongo/models/saleAccountMapping.model'

async function seed() {
  await connectToMongo()

  await SaleAccountMappingModel.create({
    companyId: 'sahet',
    cashAccount: 1105,
    bankAccount: 1110,
    accountsReceivableAccount: 1305,
    incomeAccount: 4101,
    vatAccount: 2408,
    cogsAccount: 6135,
    inventoryAccount: 1435,
  })

  console.log('✔ SaleAccountMapping creado correctamente')
  process.exit()
}

seed()
