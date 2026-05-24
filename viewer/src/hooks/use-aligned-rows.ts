import { useQueries } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { AlignedRow, RawRow, ScenarioDef } from '@/scenarios/types';

export function compareRowKey(a: string, b: string): number {
  const numPart = (k: string) => {
    const idx = k.lastIndexOf(':');
    return idx >= 0 ? k.slice(idx + 1) : k;
  };
  const aN = Number.parseFloat(numPart(a));
  const bN = Number.parseFloat(numPart(b));
  if (!Number.isNaN(aN) && !Number.isNaN(bN)) return aN - bN;
  return a.localeCompare(b);
}

export function alignRows(args: {
  scenario: ScenarioDef;
  subId: string | null;
  fileStem: string;
  perTool: Record<string, RawRow[]>;
}): AlignedRow[] {
  const { scenario, subId, fileStem, perTool } = args;
  const tools = Object.keys(perTool);
  const subdir = scenario.subScenarios.find((s) => s.id === subId)?.mediaSubdir ?? '';
  const byKey = new Map<string, AlignedRow>();

  for (const tool of tools) {
    for (const r of perTool[tool]) {
      if (!scenario.matchesFile(r, fileStem)) continue;
      if (!scenario.matchesSub(r, subId)) continue;
      const key = scenario.rowKey(r);
      let aligned = byKey.get(key);
      if (!aligned) {
        aligned = {
          key,
          label: scenario.rowLabel(r),
          mediaFilename: scenario.mediaFilename(r),
          mediaSubdir: subdir,
          cells: Object.fromEntries(tools.map((t) => [t, null])),
        };
        byKey.set(key, aligned);
      }
      aligned.cells[tool] = r;
    }
  }
  return Array.from(byKey.values()).sort((a, b) => compareRowKey(a.key, b.key));
}

export function useAlignedRows(args: {
  modality: string;
  scenario: ScenarioDef;
  subId: string | null;
  fileStem: string;
  tools: string[];
}) {
  const { modality, scenario, subId, fileStem, tools } = args;
  const queries = useQueries({
    queries: tools.map((tool) => ({
      queryKey: ['results', modality, tool, scenario.id],
      queryFn: () => api.results(modality, tool, scenario.id),
      staleTime: 60_000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const errors = queries
    .map((q, i) => (q.error ? { tool: tools[i], error: q.error } : null))
    .filter((x): x is { tool: string; error: unknown } => x !== null);

  const perTool: Record<string, RawRow[]> = {};
  tools.forEach((tool, i) => {
    perTool[tool] = queries[i].data?.rows ?? [];
  });

  const rows = alignRows({ scenario, subId, fileStem, perTool });
  return { rows, isLoading, errors };
}
