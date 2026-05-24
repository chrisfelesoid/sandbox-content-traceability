import { describe, expect, it } from 'vitest';
import { buildQueryString, parseQueryString } from './use-query-state';

describe('query string helpers', () => {
  it('parseQueryString reads all four keys', () => {
    const parsed = parseQueryString('?modality=audio&scenario=volume&sub=&file=foo');
    expect(parsed).toEqual({
      modality: 'audio',
      scenario: 'volume',
      sub: null,
      file: 'foo',
    });
  });

  it('missing keys become null', () => {
    expect(parseQueryString('')).toEqual({
      modality: null,
      scenario: null,
      sub: null,
      file: null,
    });
  });

  it('buildQueryString omits null values', () => {
    const qs = buildQueryString({
      modality: 'audio',
      scenario: 'volume',
      sub: null,
      file: 'foo',
    });
    expect(qs).toBe('?modality=audio&scenario=volume&file=foo');
  });

  it('buildQueryString returns empty string when all null', () => {
    expect(buildQueryString({ modality: null, scenario: null, sub: null, file: null })).toBe('');
  });
});
