/**
 * Parse and clamp page/limit query params.
 * page: at least 1. limit: between 1 and 100, falling back to defaultLimit.
 */
export function parsePagination(
  query: { page?: unknown; limit?: unknown },
  defaultLimit: number
): { page: number; limit: number } {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || defaultLimit));

  return { page, limit };
}
