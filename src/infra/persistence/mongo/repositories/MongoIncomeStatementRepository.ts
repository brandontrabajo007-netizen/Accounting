import type { IncomeStatementSnapshot } from '@application/reports/types/IncomeStatementSnapshot'
import type { InferSchemaType, Types } from 'mongoose'
import { IncomeStatementSnapshotModel } from '../models/incomeStatementSnapshot.model'

/* ======================================================
   TIPOS MONGO (LEAN)
====================================================== */

type IncomeStatementSnapshotDoc = InferSchemaType<typeof IncomeStatementSnapshotModel.schema> & {
  _id: Types.ObjectId
}

/* ======================================================
   NORMALIZADOR (Mongo → Dominio)
====================================================== */

function normalizeSnapshot(doc: IncomeStatementSnapshotDoc): IncomeStatementSnapshot {
  return {
    id: doc._id.toString(), // ✔ conversión explícita y segura
    companyId: doc.companyId,
    period: {
      start: typeof doc.period.start === 'string' ? doc.period.start : doc.period.start.toISOString().slice(0, 10),
      end: typeof doc.period.end === 'string' ? doc.period.end : doc.period.end.toISOString().slice(0, 10),
    },
    sections: doc.sections,
    totals: doc.totals,
    generatedAt: doc.generatedAt,
  }
}

/* ======================================================
   REPOSITORIO
====================================================== */

export class MongoIncomeStatementRepository {
  async save(snapshot: IncomeStatementSnapshot): Promise<void> {
    await IncomeStatementSnapshotModel.create({
      companyId: snapshot.companyId,
      period: {
        start: new Date(`${snapshot.period.start}T00:00:00.000Z`),
        end: new Date(`${snapshot.period.end}T23:59:59.999Z`),
      },
      sections: snapshot.sections,
      totals: snapshot.totals,
      generatedAt: snapshot.generatedAt,
    })
  }

  async findByCompany(companyId: string): Promise<IncomeStatementSnapshot[]> {
    const docs = await IncomeStatementSnapshotModel.find({ companyId }).sort({ generatedAt: -1 }).lean<IncomeStatementSnapshotDoc[]>()

    return docs.map(normalizeSnapshot)
  }

  async findById(id: string): Promise<IncomeStatementSnapshot | null> {
    const doc = await IncomeStatementSnapshotModel.findById(id).lean<IncomeStatementSnapshotDoc>()

    if (!doc) return null

    return normalizeSnapshot(doc)
  }
}
