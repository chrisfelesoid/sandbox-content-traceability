import { describe, expect, it } from 'vitest';
import { singlePass } from './single-pass';

const base = {
  tool: 'audioseal',
  file: '/workspace/audio/datasets/source/sample-000000.wav',
  status: true,
  score: 1,
  time_taken: 0.1,
};
const mp3Row = { ...base, transformation: 'mp3', bitrate_kbps: 64 };
const noiseRow = { ...base, transformation: 'noise', snr_db: 20 };
const resampleRow = { ...base, transformation: 'resample', sample_rate: 22050 };

describe('single_pass scenario', () => {
  it('exposes three sub-scenarios', () => {
    expect(singlePass.subScenarios.map((s) => s.id)).toEqual(['mp3', 'noise', 'resample']);
  });

  it('rowKey varies by sub', () => {
    expect(singlePass.rowKey(mp3Row)).toBe('bitrate:64');
    expect(singlePass.rowKey(noiseRow)).toBe('snr:20');
    expect(singlePass.rowKey(resampleRow)).toBe('sr:22050');
  });

  it('rowLabel formats per sub', () => {
    expect(singlePass.rowLabel(mp3Row)).toBe('64 kbps');
    expect(singlePass.rowLabel(noiseRow)).toBe('20 dB SNR');
    expect(singlePass.rowLabel(resampleRow)).toBe('22050 Hz');
  });

  it('mediaFilename matches on-disk pattern', () => {
    expect(singlePass.mediaFilename(mp3Row)).toBe('64kbps.wav');
    expect(singlePass.mediaFilename(noiseRow)).toBe('20db.wav');
    expect(singlePass.mediaFilename(resampleRow)).toBe('22050hz.wav');
  });

  it('matchesSub filters by transformation', () => {
    expect(singlePass.matchesSub(mp3Row, 'mp3')).toBe(true);
    expect(singlePass.matchesSub(mp3Row, 'noise')).toBe(false);
  });
});
