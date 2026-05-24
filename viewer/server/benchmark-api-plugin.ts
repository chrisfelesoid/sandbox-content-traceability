import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin } from 'vite';
import { parseJsonlFile } from './jsonl';
import { buildManifest } from './manifest';
import { safeResolve } from './safe-path';
import { serveFile } from './serve-file';

function jsonResponse(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export async function handleApi(
  workspaceRoot: string,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  if (!req.url) return false;
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) return false;

  try {
    if (url.pathname === '/api/manifest') {
      const manifest = await buildManifest(workspaceRoot);
      jsonResponse(res, 200, manifest);
      return true;
    }

    if (url.pathname === '/api/results') {
      const modality = url.searchParams.get('modality');
      const tool = url.searchParams.get('tool');
      const scenario = url.searchParams.get('scenario');
      if (!modality || !tool || !scenario) {
        jsonResponse(res, 400, { error: 'modality, tool, scenario required' });
        return true;
      }
      const root = path.join(workspaceRoot, modality, 'benchmark');
      const rel = path.join(tool, 'results', `${scenario}.jsonl`);
      const abs = safeResolve(root, rel);
      if (!abs) {
        jsonResponse(res, 400, { error: 'invalid path' });
        return true;
      }
      try {
        const result = await parseJsonlFile(abs);
        if (result.errors.length > 0) {
          for (const e of result.errors) {
            console.warn(`[benchmark-api] parse error in ${rel} line ${e.line}: ${e.message}`);
          }
        }
        jsonResponse(res, 200, { rows: result.rows });
      } catch {
        jsonResponse(res, 200, { rows: [] });
      }
      return true;
    }

    if (url.pathname.startsWith('/api/source/')) {
      const tail = url.pathname.slice('/api/source/'.length);
      const slash = tail.indexOf('/');
      if (slash < 0) {
        jsonResponse(res, 400, { error: 'modality + filename required' });
        return true;
      }
      const modality = tail.slice(0, slash);
      const rel = decodeURIComponent(tail.slice(slash + 1));
      const root = path.join(workspaceRoot, modality, 'datasets', 'source');
      const abs = safeResolve(root, rel);
      if (!abs) {
        jsonResponse(res, 400, { error: 'invalid path' });
        return true;
      }
      await serveFile(req, res, abs);
      return true;
    }

    if (url.pathname.startsWith('/api/files/')) {
      const tail = url.pathname.slice('/api/files/'.length);
      const parts = tail.split('/');
      if (parts.length < 4) {
        jsonResponse(res, 400, { error: 'modality/tool/scenario/path required' });
        return true;
      }
      const [modality, tool, scenario, ...rest] = parts;
      const root = path.join(workspaceRoot, modality, 'benchmark', tool, 'files', scenario);
      const rel = decodeURIComponent(rest.join('/'));
      const abs = safeResolve(root, rel);
      if (!abs) {
        jsonResponse(res, 400, { error: 'invalid path' });
        return true;
      }
      await serveFile(req, res, abs);
      return true;
    }

    jsonResponse(res, 404, { error: 'unknown api route' });
    return true;
  } catch (e) {
    console.error('[benchmark-api] internal error:', e);
    jsonResponse(res, 500, { error: 'internal error' });
    return true;
  }
}

export function benchmarkApiPlugin(workspaceRoot: string): Plugin {
  return {
    name: 'benchmark-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleApi(workspaceRoot, req, res);
        if (!handled) next();
      });
    },
  };
}
