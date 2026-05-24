import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export type ScenarioEntry = { id: string; files: string[] };
export type ModalityEntry = {
  name: string;
  tools: string[];
  scenarios: ScenarioEntry[];
  sourceExtensions: Record<string, string>;
};
export type Manifest = { modalities: ModalityEntry[] };

const MODALITIES = ['audio', 'image', 'video'] as const;

const SOURCE_EXT_PRIORITY: Record<string, string[]> = {
  audio: ['wav', 'mp3', 'flac', 'ogg'],
  image: ['png', 'jpg', 'jpeg', 'webp'],
  video: ['mp4', 'webm', 'mov'],
};

async function safeReaddir(dir: string): Promise<string[]> {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}

async function isDir(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function listDirNames(dir: string): Promise<string[]> {
  const names = await safeReaddir(dir);
  const out: string[] = [];
  for (const n of names) {
    if (await isDir(path.join(dir, n))) out.push(n);
  }
  return out.sort();
}

export async function buildManifest(workspaceRoot: string): Promise<Manifest> {
  const modalities: ModalityEntry[] = [];
  for (const modality of MODALITIES) {
    const benchDir = path.join(workspaceRoot, modality, 'benchmark');
    const tools = await listDirNames(benchDir);

    const scenarioFiles = new Map<string, Set<string>>();
    for (const tool of tools) {
      const filesDir = path.join(benchDir, tool, 'files');
      const scenarios = await listDirNames(filesDir);
      for (const scenario of scenarios) {
        const fileIds = await listDirNames(path.join(filesDir, scenario));
        const set = scenarioFiles.get(scenario) ?? new Set();
        for (const f of fileIds) set.add(f);
        scenarioFiles.set(scenario, set);
      }
    }
    const scenarios: ScenarioEntry[] = Array.from(scenarioFiles.entries())
      .map(([id, set]) => ({ id, files: Array.from(set).sort() }))
      .sort((a, b) => a.id.localeCompare(b.id));

    const sourceDir = path.join(workspaceRoot, modality, 'datasets', 'source');
    const sourceFiles = await safeReaddir(sourceDir);
    const stemToExts = new Map<string, Set<string>>();
    for (const name of sourceFiles) {
      const ext = path.extname(name).slice(1).toLowerCase();
      const stem = path.basename(name, path.extname(name));
      if (!ext) continue;
      const set = stemToExts.get(stem) ?? new Set();
      set.add(ext);
      stemToExts.set(stem, set);
    }
    const sourceExtensions: Record<string, string> = {};
    const priority = SOURCE_EXT_PRIORITY[modality] ?? [];
    for (const [stem, exts] of stemToExts) {
      const picked = priority.find((p) => exts.has(p)) ?? Array.from(exts)[0];
      if (picked) sourceExtensions[stem] = picked;
    }

    modalities.push({ name: modality, tools, scenarios, sourceExtensions });
  }
  return { modalities };
}
