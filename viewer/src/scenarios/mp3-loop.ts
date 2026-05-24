import { basenameStem, type ScenarioDef } from './types';

export const mp3Loop: ScenarioDef = {
  id: 'mp3_loop',
  label: 'MP3 Loop',
  subScenarios: [],
  rowKey: (r) => `iter:${r.iteration}`,
  rowLabel: (r) => `iter ${r.iteration} (${r.bitrate_kbps} kbps)`,
  mediaFilename: (r) => `iter_${String(r.iteration).padStart(3, '0')}.wav`,
  matchesFile: (r, stem) => basenameStem(r.file as string) === stem,
  matchesSub: () => true,
};
