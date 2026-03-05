import type { VariantRepo } from '../ports/VariantRepo'
import { Result } from '../types/Result'
import type { Result as ResultType } from '../types/Result'
import { VariantId } from '../../domain/value-objects/VariantId'
import type { VariantNotFound } from '../../domain/errors/VariantNotFound'

export type DeactivateVariantCommand = Readonly<{
  companyId: string
  variantId: string
}>

export function makeDeactivateVariant(deps: Readonly<{ variantRepo: VariantRepo }>) {
  return async function deactivateVariant(
    command: DeactivateVariantCommand,
  ): Promise<ResultType<{ ok: true }, VariantNotFound>> {
    const variant = await deps.variantRepo.getById(command.companyId, VariantId.from(command.variantId))
    if (!variant) {
      return Result.err({ type: 'VariantNotFound', variantId: command.variantId })
    }

    await deps.variantRepo.deactivate(command.companyId, VariantId.from(command.variantId))

    return Result.ok({ ok: true })
  }
}
