"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeInMemoryDomainEventBus = void 0;
const makeInMemoryDomainEventBus = (handlers) => ({
    publish: async (event) => {
        for (const handler of handlers) {
            await handler(event);
        }
    },
});
exports.makeInMemoryDomainEventBus = makeInMemoryDomainEventBus;
