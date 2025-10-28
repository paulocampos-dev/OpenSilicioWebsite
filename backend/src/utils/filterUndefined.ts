/**
 * Filter out undefined values from an object
 * This is useful for partial updates where we only want to update fields that are actually provided
 *
 * @param obj - The object to filter
 * @returns A new object with only defined values
 */
export function filterUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const filtered: Partial<T> = {};

  for (const key in obj) {
    if (obj[key] !== undefined) {
      filtered[key] = obj[key];
    }
  }

  return filtered;
}
