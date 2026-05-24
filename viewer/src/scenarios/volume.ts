import { basenameStem, type ScenarioDef } from './types';

export const volume: ScenarioDef = {
  id: 'volume',
  label: 'Volume',
  subScenarios: [],
  rowKey: (r) => String(r.volume_db),
  rowLabel: (r) => {
    const v = r.volume_db as number;
    return `${v > 0 ? '+' : ''}${v} dB`;
  },
  mediaFilename: (r) => `${r.volume_db}db.wav`,
  matchesFile: (r, stem) => basenameStem(r.file as string) === stem,
  matchesSub: () => true,
};
