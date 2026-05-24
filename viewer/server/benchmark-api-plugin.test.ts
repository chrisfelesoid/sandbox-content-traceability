import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleApi } from './benchmark-api-plugin';

const ROOT = path.resolve(__dirname, '../..');

function makeReqRes(url: string, headers: Record<string, string> = {}) {
  const req = new IncomingMessage(new Socket());
  req.url = url;
  req.method = 'GET';
  Object.assign(req.headers, headers);
  const res = new ServerResponse(req);
  const chunks: Buffer[] = [];
  res.write = ((chunk: Buffer | string) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return true;
  }) as ServerResponse['write'];
  const orig = res.end.bind(res);
  res.end = ((chunk?: Buffer | string) => {
    if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return orig();
  }) as ServerResponse['end'];
  return {
    req,
    res,
    body: () => Buffer.concat(chunks).toString('utf8'),
  };
}

describe('handleApi', () => {
  it('serves /api/manifest', async () => {
    const { req, res, body } = makeReqRes('/api/manifest');
    const handled = await handleApi(ROOT, req, res);
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);
    const json = JSON.parse(body());
    expect(json.modalities.find((m: { name: string }) => m.name === 'audio').tools).toContain(
      'audioseal',
    );
  });

  it('serves /api/results?modality=audio&tool=audioseal&scenario=volume', async () => {
    const { req, res, body } = makeReqRes(
      '/api/results?modality=audio&tool=audioseal&scenario=volume',
    );
    const handled = await handleApi(ROOT, req, res);
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);
    const json = JSON.parse(body());
    expect(json.rows.length).toBeGreaterThan(0);
    expect(json.rows[0]).toHaveProperty('tool', 'audioseal');
  });

  it('returns 200 + empty rows for nonexistent scenario', async () => {
    const { req, res, body } = makeReqRes(
      '/api/results?modality=audio&tool=audioseal&scenario=nope',
    );
    const handled = await handleApi(ROOT, req, res);
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(body())).toEqual({ rows: [] });
  });

  it('rejects path traversal in /api/files', async () => {
    const { req, res } = makeReqRes('/api/files/audio/audioseal/volume/..%2F..%2F..%2Fetc/passwd');
    const handled = await handleApi(ROOT, req, res);
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(400);
  });

  it('returns false for non /api requests', async () => {
    const { req, res } = makeReqRes('/index.html');
    const handled = await handleApi(ROOT, req, res);
    expect(handled).toBe(false);
  });
});
