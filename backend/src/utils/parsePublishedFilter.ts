/**
 * Coerce the `published` query string into a tri-state filter:
 * 'true' -> true, 'false' -> false, anything else -> undefined (no filter).
 */
export function parsePublishedFilter(query: { published?: unknown }): boolean | undefined {
  return query.published === 'true' ? true : query.published === 'false' ? false : undefined;
}
