import { describe, expect, it } from 'vitest';
import { parseJsonlString } from './jsonl';

describe('parseJsonlString', () => {
  it('parses valid lines into objects', () => {
    const text = '{"a":1}\n{"b":2}\n';
    expect(parseJsonlString(text)).toEqual({
      rows: [{ a: 1 }, { b: 2 }],
      errors: [],
    });
  });

  it('skips malformed lines and records line numbers', () => {
    const text = '{"a":1}\nnot-json\n{"b":2}\n';
    const result = parseJsonlString(text);
    expect(result.rows).toEqual([{ a: 1 }, { b: 2 }]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(2);
  });

  it('tolerates trailing blank lines', () => {
    expect(parseJsonlString('{"a":1}\n\n\n').rows).toEqual([{ a: 1 }]);
  });

  it('returns empty result for empty string', () => {
    expect(parseJsonlString('')).toEqual({ rows: [], errors: [] });
  });
});
