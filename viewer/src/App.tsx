import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { SelectorBar, type SelectorState } from '@/components/selectors/selector-bar';
import { RowDetailSheet, type SelectedCell } from '@/components/side-panel/row-detail-sheet';
import { BenchmarkTable } from '@/components/table/benchmark-table';
import { mediaKindFromModality } from '@/components/table/lazy-media';
import { useManifest } from '@/hooks/use-manifest';
import { useQueryState } from '@/hooks/use-query-state';
import { getScenario, scenarios } from '@/scenarios';

function defaultsFromManifest(
  manifest: ReturnType<typeof useManifest>['data'],
): SelectorState | null {
  if (!manifest) return null;
  const audio =
    manifest.modalities.find((m) => m.name === 'audio' && m.tools.length > 0) ??
    manifest.modalities.find((m) => m.tools.length > 0);
  if (!audio) return null;
  const scenarioEntry = audio.scenarios[0];
  if (!scenarioEntry) return null;
  const def = getScenario(scenarioEntry.id);
  return {
    modality: audio.name,
    scenario: scenarioEntry.id,
    sub: def?.subScenarios[0]?.id ?? null,
    file: scenarioEntry.files[0] ?? '',
  };
}

export default function App() {
  const manifestQ = useManifest();
  const [query, setQuery] = useQueryState();
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  // sync URL defaults from manifest if any field is missing or invalid.
  useEffect(() => {
    if (!manifestQ.data) return;
    const defaults = defaultsFromManifest(manifestQ.data);
    if (!defaults) return;
    const m = manifestQ.data.modalities.find((x) => x.name === query.modality);
    const sc = m?.scenarios.find((x) => x.id === query.scenario);
    const def = query.scenario ? getScenario(query.scenario) : undefined;
    const subOk =
      !def || def.subScenarios.length === 0 || def.subScenarios.some((s) => s.id === query.sub);
    const fileOk = sc?.files.includes(query.file ?? '') ?? false;
    if (!m || !sc || !subOk || !fileOk) {
      setQuery({ ...defaults });
    }
  }, [manifestQ.data, query, setQuery]);

  if (manifestQ.isLoading) return <div className="p-4">Loading manifest…</div>;
  if (manifestQ.error)
    return (
      <div className="p-4 text-destructive">
        Failed to load manifest:
        <pre>{String(manifestQ.error)}</pre>
      </div>
    );
  const manifest = manifestQ.data;
  if (!manifest) return null;

  const modality = manifest.modalities.find((m) => m.name === query.modality);
  if (!modality || !query.scenario || !query.file) {
    return <div className="p-4 text-muted-foreground">Select a modality, scenario, and file.</div>;
  }
  if (modality.tools.length === 0) {
    return (
      <>
        <SelectorBar
          manifest={manifest}
          state={selectorState(query)}
          onChange={(s) => setQuery({ ...s })}
        />
        <div className="p-4 text-muted-foreground">
          No benchmark data found for "{modality.name}".
        </div>
      </>
    );
  }

  const scenarioDef = getScenario(query.scenario);
  if (!scenarioDef) {
    return (
      <div className="p-4 text-destructive">
        Unknown scenario "{query.scenario}". Known: {Object.keys(scenarios).join(', ')}
      </div>
    );
  }
  const ext = modality.sourceExtensions[query.file];

  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b">
        <h1 className="px-4 pt-4 text-lg font-semibold">Benchmark Viewer</h1>
        <SelectorBar
          manifest={manifest}
          state={selectorState(query)}
          onChange={(s) => setQuery({ ...s })}
        />
      </header>
      <main className="p-4">
        <BenchmarkTable
          modality={modality.name}
          tools={modality.tools}
          scenario={scenarioDef}
          subId={query.sub}
          fileStem={query.file}
          sourceExt={ext}
          onCellClick={({ tool, row }) =>
            setSelectedCell({
              tool,
              scenarioLabel: scenarioDef.label,
              row,
              mediaUrl: api.filesUrl(
                modality.name,
                tool,
                scenarioDef.id,
                [query.file, row.mediaSubdir, row.mediaFilename].filter(Boolean).join('/'),
              ),
              mediaKind: mediaKindFromModality(modality.name),
            })
          }
        />
      </main>
      <RowDetailSheet selected={selectedCell} onOpenChange={(o) => !o && setSelectedCell(null)} />
    </div>
  );
}

function selectorState(q: ReturnType<typeof useQueryState>[0]): SelectorState {
  return {
    modality: q.modality ?? '',
    scenario: q.scenario ?? '',
    sub: q.sub,
    file: q.file ?? '',
  };
}
