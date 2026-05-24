export type RawRow = Record<string, unknown> & {
  tool: string;
  file: string;
  status: boolean;
  score: number;
  time_taken: number;
  cause?: string;
};

export type SubScenario = {
  id: string;
  label: string;
  mediaSubdir: string;
};

export type ScenarioDef = {
  id: string;
  label: string;
  subScenarios: SubScenario[];
  rowKey(row: RawRow): string;
  rowLabel(row: RawRow): string;
  mediaFilename(row: RawRow): string;
  matchesFile(row: RawRow, fileStem: string): boolean;
  matchesSub(row: RawRow, subId: string | null): boolean;
};

export type AlignedRow = {
  key: string;
  label: string;
  mediaFilename: string;
  mediaSubdir: string;
  cells: Record<string, RawRow | null>;
};

export function basenameStem(p: string): string {
  const base = p.split('/').pop() ?? p;
  const dot = base.lastIndexOf('.');
  return dot < 0 ? base : base.slice(0, dot);
}
