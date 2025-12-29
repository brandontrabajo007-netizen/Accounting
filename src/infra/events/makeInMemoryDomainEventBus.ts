import type { DomainEventBus } from '@application/accounting-periods/ports/DomainEventBus'

type EventHandler = (event: unknown) => Promise<void>

export const makeInMemoryDomainEventBus = (handlers: EventHandler[]): DomainEventBus => ({
  publish: async (event) => {
    for (const handler of handlers) {
      await handler(event)
    }
  },
})
