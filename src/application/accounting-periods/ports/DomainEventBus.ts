export type DomainEventBus = {
  publish: (event: unknown) => Promise<void>
}
