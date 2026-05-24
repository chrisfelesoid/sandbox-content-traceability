import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { safeResolve } from './safe-path';

const root = path.resolve('/tmp/foo');

describe('safeResolve', () => {
  it('resolves paths under root', () => {
    expect(safeResolve(root, 'a/b.txt')).toBe(path.join(root, 'a/b.txt'));
  });

  it('rejects parent traversal', () => {
    expect(safeResolve(root, '../etc/passwd')).toBeNull();
    expect(safeResolve(root, 'a/../../../etc')).toBeNull();
  });

  it('accepts the root itself', () => {
    expect(safeResolve(root, '')).toBe(root);
    expect(safeResolve(root, '.')).toBe(root);
  });

  it('rejects absolute paths outside root', () => {
    expect(safeResolve(root, '/etc/passwd')).toBeNull();
  });
});
