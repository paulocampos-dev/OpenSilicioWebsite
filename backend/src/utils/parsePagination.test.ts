import { parsePagination } from './parsePagination';

describe('parsePagination', () => {
  it('falls back to defaultLimit and page 1 when params are absent', () => {
    expect(parsePagination({}, 10)).toEqual({ page: 1, limit: 10 });
  });

  it('parses valid numeric strings', () => {
    expect(parsePagination({ page: '3', limit: '25' }, 10)).toEqual({ page: 3, limit: 25 });
  });

  it('clamps page below 1 up to 1', () => {
    expect(parsePagination({ page: '0' }, 10)).toEqual({ page: 1, limit: 10 });
    expect(parsePagination({ page: '-5' }, 10)).toEqual({ page: 1, limit: 10 });
  });

  it('clamps limit above 100 down to 100', () => {
    expect(parsePagination({ limit: '9999' }, 10)).toEqual({ page: 1, limit: 100 });
  });

  it('clamps a parsed negative limit up to 1', () => {
    expect(parsePagination({ limit: '-3' }, 10)).toEqual({ page: 1, limit: 1 });
  });

  it('falls back to defaultLimit for limit=0 (falsy short-circuit, matches prior behavior)', () => {
    expect(parsePagination({ limit: '0' }, 10)).toEqual({ page: 1, limit: 10 });
  });

  it('falls back to defaultLimit on garbage input', () => {
    expect(parsePagination({ page: 'abc', limit: 'xyz' }, 20)).toEqual({ page: 1, limit: 20 });
  });
});
