import { createReadStream } from 'node:fs';
import { type Stats, stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';

const MIME: Record<string, string> = {
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export async function serveFile(
  req: IncomingMessage,
  res: ServerResponse,
  absPath: string,
): Promise<void> {
  let info: Stats;
  try {
    info = await stat(absPath);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'file not found', path: absPath }));
    return;
  }
  if (!info.isFile()) {
    res.statusCode = 404;
    res.end();
    return;
  }
  const ext = path.extname(absPath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
  res.setHeader('Accept-Ranges', 'bytes');

  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      let start: number;
      let end: number;
      if (m[1] === '' && m[2] !== '') {
        // suffix-length: last N bytes
        const suffix = Number.parseInt(m[2], 10);
        start = Math.max(0, info.size - suffix);
        end = info.size - 1;
      } else {
        start = m[1] ? Number.parseInt(m[1], 10) : 0;
        end = m[2] ? Number.parseInt(m[2], 10) : info.size - 1;
      }
      if (start >= info.size || end >= info.size || start > end) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${info.size}`);
        res.end();
        return;
      }
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
      res.setHeader('Content-Length', String(end - start + 1));
      createReadStream(absPath, { start, end }).pipe(res);
      return;
    }
  }
  res.statusCode = 200;
  res.setHeader('Content-Length', String(info.size));
  createReadStream(absPath).pipe(res);
}
