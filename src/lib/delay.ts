/**
 * Resolves after the given number of milliseconds.
 *
 * Shared streaming-latency helper for overview parallel-route server
 * components while the PocketBase-backed data layer is wired up.
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));