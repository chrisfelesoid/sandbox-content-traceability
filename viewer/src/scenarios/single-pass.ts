import { basenameStem, type ScenarioDef } from './types';

export const singlePass: ScenarioDef = {
  id: 'single_pass',
  label: 'Single Pass',
  subScenarios: [
    { id: 'mp3', label: 'MP3 Compression', mediaSubdir: 'mp3' },
    { id: 'noise', label: 'Noise', mediaSubdir: 'noise' },
    { id: 'resample', label: 'Resample', mediaSubdir: 'resample' },
  ],
  rowKey: (r) => {
    if (r.transformation === 'mp3') return `bitrate:${r.bitrate_kbps}`;
    if (r.transformation === 'noise') return `snr:${r.snr_db}`;
    if (r.transformation === 'resample') return `sr:${r.sample_rate}`;
    return 'unknown';
  },
  rowLabel: (r) => {
    if (r.transformation === 'mp3') return `${r.bitrate_kbps} kbps`;
    if (r.transformation === 'noise') return `${r.snr_db} dB SNR`;
    if (r.transformation === 'resample') return `${r.sample_rate} Hz`;
    return '?';
  },
  mediaFilename: (r) => {
    if (r.transformation === 'mp3') return `${r.bitrate_kbps}kbps.wav`;
    if (r.transformation === 'noise') return `${r.snr_db}db.wav`;
    if (r.transformation === 'resample') return `${r.sample_rate}hz.wav`;
    return '';
  },
  matchesFile: (r, stem) => basenameStem(r.file as string) === stem,
  matchesSub: (r, subId) => r.transformation === subId,
};
