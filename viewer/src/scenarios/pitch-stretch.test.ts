import { describe, expect, it } from 'vitest';
import { pitchStretch } from './pitch-stretch';

const base = {
  tool: 'audioseal',
  file: '/workspace/audio/datasets/source/sample-000000.wav',
  status: false,
  score: 0.1,
  time_taken: 0.1,
};
const shiftRow = { ...base, scenario: 'pitch_shift', semitones: -2 };
const shiftPos = { ...base, scenario: 'pitch_shift', semitones: 2 };
const stretchRow = { ...base, scenario: 'time_stretch', speed_ratio: 0.75 };

describe('pitch_stretch scenario', () => {
  it('exposes two sub-scenarios', () => {
    expect(pitchStretch.subScenarios.map((s) => s.id)).toEqual(['pitch_shift', 'time_stretch']);
  });

  it('rowKey by sub', () => {
    expect(pitchStretch.rowKey(shiftRow)).toBe('st:-2');
    expect(pitchStretch.rowKey(stretchRow)).toBe('sp:0.75');
  });

  it('rowLabel formats with sign for semitones', () => {
    expect(pitchStretch.rowLabel(shiftRow)).toBe('-2 st');
    expect(pitchStretch.rowLabel(shiftPos)).toBe('+2 st');
    expect(pitchStretch.rowLabel(stretchRow)).toBe('0.75x');
  });

  it('mediaFilename matches on-disk pattern', () => {
    expect(pitchStretch.mediaFilename(shiftRow)).toBe('-2st.wav');
    expect(pitchStretch.mediaFilename(shiftPos)).toBe('2st.wav');
    expect(pitchStretch.mediaFilename(stretchRow)).toBe('0.75x.wav');
  });

  it('matchesSub by scenario field', () => {
    expect(pitchStretch.matchesSub(shiftRow, 'pitch_shift')).toBe(true);
    expect(pitchStretch.matchesSub(shiftRow, 'time_stretch')).toBe(false);
  });
});
