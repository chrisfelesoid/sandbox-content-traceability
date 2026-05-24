import { describe, expect, it } from 'vitest';
import { mp3Loop } from './mp3-loop';

const row = {
  tool: 'audioseal',
  file: '/workspace/audio/datasets/source/sample-000000.wav',
  bitrate_kbps: 64,
  iteration: 3,
  status: true,
  score: 1,
  time_taken: 0.02,
};

describe('mp3_loop scenario', () => {
  it('rowKey by iteration', () => {
    expect(mp3Loop.rowKey(row)).toBe('iter:3');
  });

  it('rowLabel includes iteration and bitrate', () => {
    expect(mp3Loop.rowLabel(row)).toBe('iter 3 (64 kbps)');
  });

  it('mediaFilename zero-pads', () => {
    expect(mp3Loop.mediaFilename(row)).toBe('iter_003.wav');
    expect(mp3Loop.mediaFilename({ ...row, iteration: 12 })).toBe('iter_012.wav');
  });

  it('matchesFile by stem', () => {
    expect(mp3Loop.matchesFile(row, 'sample-000000')).toBe(true);
  });
});
