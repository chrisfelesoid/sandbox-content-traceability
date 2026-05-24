import { describe, expect, it } from 'vitest';
import type { RawRow } from '@/scenarios/types';
import { volume } from '@/scenarios/volume';
import { alignRows, compareRowKey } from './use-aligned-rows';

function row(tool: string, db: number, status = true, score = 1): RawRow {
  return {
    tool,
    file: '/workspace/audio/datasets/source/sample-000000.wav',
    volume_db: db,
    status,
    score,
    time_taken: 0.1,
  };
}

describe('alignRows', () => {
  it('aligns rows from multiple tools by rowKey', () => {
    const result = alignRows({
      scenario: volume,
      subId: null,
      fileStem: 'sample-000000',
      perTool: {
        audioseal: [row('audioseal', -10), row('audioseal', -15)],
        audiowmark: [row('audiowmark', -10), row('audiowmark', -15)],
        silentcipher: [row('silentcipher', -10)],
      },
    });
    expect(result.map((r) => r.key)).toEqual(['-15', '-10']);
    expect(result[1].cells.audioseal?.volume_db).toBe(-10);
    expect(result[0].cells.silentcipher).toBeNull();
  });

  it('filters rows by file stem', () => {
    const r = row('audioseal', -10);
    r.file = '/workspace/audio/datasets/source/sample-000001.wav';
    const result = alignRows({
      scenario: volume,
      subId: null,
      fileStem: 'sample-000000',
      perTool: { audioseal: [r] },
    });
    expect(result).toEqual([]);
  });
});

describe('compareRowKey', () => {
  it('sorts numeric portion ascending including negatives', () => {
    const keys = ['10', '-15', '-3', '6', '-10'].sort(compareRowKey);
    expect(keys).toEqual(['-15', '-10', '-3', '6', '10']);
  });

  it('sorts colon-prefixed numbers', () => {
    const keys = ['iter:10', 'iter:2', 'iter:1'].sort(compareRowKey);
    expect(keys).toEqual(['iter:1', 'iter:2', 'iter:10']);
  });
});
