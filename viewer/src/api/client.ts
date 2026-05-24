import type { Manifest, ResultsResponse } from './types';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return (await res.json()) as T;
}

export const api = {
  manifest: () => getJson<Manifest>('/api/manifest'),
  results: (modality: string, tool: string, scenario: string) =>
    getJson<ResultsResponse>(
      `/api/results?modality=${encodeURIComponent(modality)}&tool=${encodeURIComponent(tool)}&scenario=${encodeURIComponent(scenario)}`,
    ),
  filesUrl: (modality: string, tool: string, scenario: string, rest: string) =>
    `/api/files/${encodeURIComponent(modality)}/${encodeURIComponent(tool)}/${encodeURIComponent(scenario)}/${rest.split('/').map(encodeURIComponent).join('/')}`,
  sourceUrl: (modality: string, filename: string) =>
    `/api/source/${encodeURIComponent(modality)}/${encodeURIComponent(filename)}`,
};
