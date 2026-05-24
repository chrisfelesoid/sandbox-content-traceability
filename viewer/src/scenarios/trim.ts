import { basenameStem, type ScenarioDef } from './types';

export const trim: ScenarioDef = {
  id: 'trim',
  label: 'Trim',
  subScenarios: [
    { id: 'head_trim', label: 'Head Trim', mediaSubdir: 'head_trim' },
    { id: 'tail_trim', label: 'Tail Trim', mediaSubdir: 'tail_trim' },
    { id: 'recursive_cut', label: 'Recursive Cut', mediaSubdir: 'recursive_cut' },
  ],
  rowKey: (r) => `iter:${r.iteration}`,
  rowLabel: (r) => `iter ${r.iteration} (step ${r.step_ms}ms, ${r.remaining_ms}ms left)`,
  mediaFilename: (r) => `iter_${String(r.iteration).padStart(3, '0')}.wav`,
  matchesFile: (r, stem) => basenameStem(r.file as string) === stem,
  matchesSub: (r, subId) => r.scenario === subId,
};
