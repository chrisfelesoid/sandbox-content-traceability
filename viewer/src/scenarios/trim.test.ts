import { describe, expect, it } from 'vitest';
import { trim } from './trim';

const row = {
  tool: 'audioseal',
  file: '/workspace/audio/datasets/source/sample-000000.wav',
  scenario: 'head_trim',
  step_ms: 500,
  iteration: 2,
  remaining_ms: 137000,
  status: false,
  score: 0.5,
  time_taken: 0.3,
};

describe('trim scenario', () => {
  it('exposes three sub-scenarios', () => {
    expect(trim.subScenarios.map((s) => s.id)).toEqual(['head_trim', 'tail_trim', 'recursive_cut']);
  });

  it('rowKey by iteration', () => {
    expect(trim.rowKey(row)).toBe('iter:2');
  });

  it('rowLabel includes iteration and step and remaining', () => {
    expect(trim.rowLabel(row)).toBe('iter 2 (step 500ms, 137000ms left)');
  });

  it('mediaFilename zero-pads', () => {
    expect(trim.mediaFilename(row)).toBe('iter_002.wav');
  });

  it('matchesSub by scenario field', () => {
    expect(trim.matchesSub(row, 'head_trim')).toBe(true);
    expect(trim.matchesSub(row, 'tail_trim')).toBe(false);
  });
});
