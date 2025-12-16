import { AccountType } from '@domain/accounts/AccountType'
import { connectToMongo } from '../infra/persistence/mongo/connect'
import { AccountModel } from '../infra/persistence/mongo/models/account.model'

async function seed() {
  await connectToMongo()

  const accounts = [
    {
      code: 5195,
      name: 'Gastos operativos',
      type: AccountType.EXPENSE,
      nature: 'debit',
    },
    {
      code: 5135,
      name: 'Servicios',
      type: AccountType.EXPENSE,
      nature: 'debit',
    },
    {
      code: 1524,
      name: 'Propiedades, planta y equipo',
      type: AccountType.ASSET,
      nature: 'debit',
    },
    {
      code: 5105,
      name: 'Gastos de personal (nómina)',
      type: AccountType.EXPENSE,
      nature: 'debit',
    },
  ]

  for (const acc of accounts) {
    const exists = await AccountModel.findOne({ code: acc.code })

    if (!exists) {
      await AccountModel.create(acc)
      console.log(`✔ Cuenta creada: ${acc.code} – ${acc.name}`)
    } else {
      console.log(`↷ Cuenta ya existente: ${acc.code}`)
    }
  }

  console.log('🎉 Catálogo contable actualizado correctamente.')
  process.exit()
}

seed()
