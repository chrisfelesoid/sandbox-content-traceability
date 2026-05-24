import type { RawRow } from '@/scenarios/types';

export type ScenarioEntry = { id: string; files: string[] };
export type ModalityEntry = {
  name: string;
  tools: string[];
  scenarios: ScenarioEntry[];
  sourceExtensions: Record<string, string>;
};
export type Manifest = { modalities: ModalityEntry[] };

export type ResultsResponse = { rows: RawRow[] };
