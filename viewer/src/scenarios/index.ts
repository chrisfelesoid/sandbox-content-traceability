import { mp3Loop } from './mp3-loop';
import { pitchStretch } from './pitch-stretch';
import { singlePass } from './single-pass';
import { trim } from './trim';
import type { ScenarioDef } from './types';
import { volume } from './volume';

export const scenarios = {
  volume,
  mp3_loop: mp3Loop,
  single_pass: singlePass,
  pitch_stretch: pitchStretch,
  trim,
} satisfies Record<string, ScenarioDef>;

export type ScenarioId = keyof typeof scenarios;

export function getScenario(id: string): ScenarioDef | undefined {
  return (scenarios as Record<string, ScenarioDef>)[id];
}
