import { parsePublishedFilter } from './parsePublishedFilter';

describe('parsePublishedFilter', () => {
  it('returns true for "true"', () => {
    expect(parsePublishedFilter({ published: 'true' })).toBe(true);
  });

  it('returns false for "false"', () => {
    expect(parsePublishedFilter({ published: 'false' })).toBe(false);
  });

  it('returns undefined when absent', () => {
    expect(parsePublishedFilter({})).toBeUndefined();
  });

  it('returns undefined for any other value', () => {
    expect(parsePublishedFilter({ published: 'maybe' })).toBeUndefined();
  });
});
