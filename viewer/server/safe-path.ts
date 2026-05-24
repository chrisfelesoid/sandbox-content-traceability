import path from 'node:path';

export function safeResolve(root: string, requested: string): string | null {
  const absRoot = path.resolve(root);
  // Reject absolute paths that are not under root
  if (
    path.isAbsolute(requested) &&
    !requested.startsWith(absRoot + path.sep) &&
    requested !== absRoot
  ) {
    return null;
  }
  const candidate = path.resolve(absRoot, requested.replace(/^\/+/, ''));
  if (candidate === absRoot) return candidate;
  if (!candidate.startsWith(absRoot + path.sep)) return null;
  return candidate;
}
