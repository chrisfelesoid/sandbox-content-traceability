import { basenameStem, type ScenarioDef } from './types';

export const pitchStretch: ScenarioDef = {
  id: 'pitch_stretch',
  label: 'Pitch / Stretch',
  subScenarios: [
    { id: 'pitch_shift', label: 'Pitch Shift', mediaSubdir: 'pitch_shift' },
    { id: 'time_stretch', label: 'Time Stretch', mediaSubdir: 'time_stretch' },
  ],
  rowKey: (r) => (r.scenario === 'pitch_shift' ? `st:${r.semitones}` : `sp:${r.speed_ratio}`),
  rowLabel: (r) => {
    if (r.scenario === 'pitch_shift') {
      const v = r.semitones as number;
      return `${v > 0 ? '+' : ''}${v} st`;
    }
    return `${r.speed_ratio}x`;
  },
  mediaFilename: (r) =>
    r.scenario === 'pitch_shift' ? `${r.semitones}st.wav` : `${r.speed_ratio}x.wav`,
  matchesFile: (r, stem) => basenameStem(r.file as string) === stem,
  matchesSub: (r, subId) => r.scenario === subId,
};
