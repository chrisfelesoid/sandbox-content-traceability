import { useCallback, useEffect, useState } from 'react';

export type QueryState = {
  modality: string | null;
  scenario: string | null;
  sub: string | null;
  file: string | null;
};

const KEYS: (keyof QueryState)[] = ['modality', 'scenario', 'sub', 'file'];

export function parseQueryString(search: string): QueryState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const out: QueryState = { modality: null, scenario: null, sub: null, file: null };
  for (const k of KEYS) {
    const v = params.get(k);
    out[k] = v && v.length > 0 ? v : null;
  }
  return out;
}

export function buildQueryString(state: QueryState): string {
  const params = new URLSearchParams();
  for (const k of KEYS) {
    const v = state[k];
    if (v != null && v.length > 0) params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useQueryState(): [QueryState, (patch: Partial<QueryState>) => void] {
  const [state, setState] = useState<QueryState>(() => parseQueryString(window.location.search));

  useEffect(() => {
    const onPop = () => setState(parseQueryString(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const set = useCallback((patch: Partial<QueryState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      const qs = buildQueryString(next);
      const newUrl = `${window.location.pathname}${qs}${window.location.hash}`;
      window.history.replaceState(null, '', newUrl);
      return next;
    });
  }, []);

  return [state, set];
}
