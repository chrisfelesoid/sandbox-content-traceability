import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildManifest } from './manifest';

const ROOT = path.resolve(__dirname, '../..');

describe('buildManifest', () => {
  it('returns audio modality with three tools', async () => {
    const m = await buildManifest(ROOT);
    const audio = m.modalities.find((x) => x.name === 'audio');
    expect(audio).toBeDefined();
    expect(audio?.tools).toEqual(
      expect.arrayContaining(['audioseal', 'audiowmark', 'silentcipher']),
    );
  });

  it('lists all five scenarios for audio', async () => {
    const m = await buildManifest(ROOT);
    const audio = m.modalities.find((x) => x.name === 'audio');
    const ids = audio?.scenarios.map((s) => s.id).sort();
    expect(ids).toEqual(['mp3_loop', 'pitch_stretch', 'single_pass', 'trim', 'volume']);
  });

  it('aggregates files per scenario across tools', async () => {
    const m = await buildManifest(ROOT);
    const audio = m.modalities.find((x) => x.name === 'audio');
    const volume = audio?.scenarios.find((s) => s.id === 'volume');
    expect(volume?.files).toEqual(expect.arrayContaining(['sample-000000', 'sample-000001']));
  });

  it('resolves source extensions for audio files', async () => {
    const m = await buildManifest(ROOT);
    const audio = m.modalities.find((x) => x.name === 'audio');
    expect(audio?.sourceExtensions['sample-000000']).toBe('wav');
  });

  it('returns empty arrays for absent modalities', async () => {
    const m = await buildManifest(ROOT);
    const image = m.modalities.find((x) => x.name === 'image');
    expect(image).toBeDefined();
    expect(image?.tools).toEqual([]);
    expect(image?.scenarios).toEqual([]);
  });
});
