////////////////////////////////////////////////////////////////////////////////
// 🛑 Nothing in here has anything to do with Nextjs, it's just a fake database
////////////////////////////////////////////////////////////////////////////////

/**
 * Simple delay utility for simulating API latency in mock services.
 * Used by overview, users, campaigns, and admin mock services.
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
