import { readFile } from 'node:fs/promises';

export type ParseResult = {
  rows: Record<string, unknown>[];
  errors: { line: number; message: string }[];
};

export function parseJsonlString(text: string): ParseResult {
  const rows: Record<string, unknown>[] = [];
  const errors: { line: number; message: string }[] = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '') continue;
    try {
      rows.push(JSON.parse(trimmed));
    } catch (e) {
      errors.push({ line: i + 1, message: (e as Error).message });
    }
  }
  return { rows, errors };
}

export async function parseJsonlFile(absPath: string): Promise<ParseResult> {
  const text = await readFile(absPath, 'utf8');
  return parseJsonlString(text);
}
