import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getScenario } from '@/scenarios';
import { parseJsonlFile } from '../../server/jsonl';
import { buildManifest } from '../../server/manifest';

const ROOT = path.resolve(__dirname, '../../..');

function stemOf(p: string): string {
  const base = p.split('/').pop() ?? p;
  const dot = base.lastIndexOf('.');
  return dot < 0 ? base : base.slice(0, dot);
}

describe('scenarios vs on-disk files', () => {
  it('reports rows whose media file is missing on disk', async () => {
    const manifest = await buildManifest(ROOT);
    const missing: string[] = [];
    let checked = 0;
    for (const modality of manifest.modalities) {
      for (const tool of modality.tools) {
        for (const scenarioEntry of modality.scenarios) {
          const def = getScenario(scenarioEntry.id);
          if (!def) continue;
          const abs = path.join(
            ROOT,
            modality.name,
            'benchmark',
            tool,
            'results',
            `${scenarioEntry.id}.jsonl`,
          );
          if (!existsSync(abs)) continue;
          const { rows } = await parseJsonlFile(abs);
          for (const r of rows) {
            const row = r as Record<string, unknown> & { file: string };
            const subdir =
              def.subScenarios.find((s) => def.matchesSub(row, s.id))?.mediaSubdir ?? '';
            const fileStem = stemOf(row.file);
            const filename = def.mediaFilename(row);
            const full = path.join(
              ROOT,
              modality.name,
              'benchmark',
              tool,
              'files',
              scenarioEntry.id,
              fileStem,
              subdir,
              filename,
            );
            checked++;
            if (!existsSync(full)) missing.push(full);
          }
        }
      }
    }
    console.warn(`integrity: checked ${checked}, missing ${missing.length}`);
    if (missing.length > 0) {
      console.warn('first 10 missing:', missing.slice(0, 10).join('\n'));
    }
    expect(checked).toBeGreaterThan(0);
  });
});
