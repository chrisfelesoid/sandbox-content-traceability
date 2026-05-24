import { describe, expect, it } from 'vitest';
import { volume } from './volume';

const row = {
  tool: 'audioseal',
  file: '/workspace/audio/datasets/source/sample-000000.wav',
  volume_db: -10,
  status: false,
  score: 0.99,
  time_taken: 0.1,
  cause: 'parity mismatch',
};

describe('volume scenario', () => {
  it('id and no sub-scenarios', () => {
    expect(volume.id).toBe('volume');
    expect(volume.subScenarios).toEqual([]);
  });

  it('rowKey returns volume_db as string', () => {
    expect(volume.rowKey(row)).toBe('-10');
  });

  it('rowLabel formats with sign', () => {
    expect(volume.rowLabel(row)).toBe('-10 dB');
    expect(volume.rowLabel({ ...row, volume_db: 6 })).toBe('+6 dB');
  });

  it('mediaFilename matches on-disk pattern', () => {
    expect(volume.mediaFilename(row)).toBe('-10db.wav');
    expect(volume.mediaFilename({ ...row, volume_db: 6 })).toBe('6db.wav');
  });

  it('matchesFile by stem', () => {
    expect(volume.matchesFile(row, 'sample-000000')).toBe(true);
    expect(volume.matchesFile(row, 'sample-000001')).toBe(false);
  });

  it('matchesSub always true (no sub-scenarios)', () => {
    expect(volume.matchesSub(row, null)).toBe(true);
    expect(volume.matchesSub(row, 'anything')).toBe(true);
  });
});
