import { readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { closeAll } from '../helpers';
import { listRoutes } from '../routeList';

afterAll(closeAll);

describe('docs/openapi.yaml', () => {
  const spec = YAML.parse(readFileSync(path.resolve(__dirname, '../../../docs/openapi.yaml'), 'utf8'));
  const documented = new Set<string>();
  for (const [p, item] of Object.entries<Record<string, unknown>>(spec.paths)) {
    for (const m of Object.keys(item)) documented.add(`${m.toUpperCase()} ${p}`);
  }

  it('documents every route the server exposes (run `node scripts/gen-openapi.mjs` after adding one)', () => {
    const missing = listRoutes(createApp()).filter((r) => !documented.has(r));
    expect(missing).toEqual([]);
  });
  it('documents nothing that does not exist', () => {
    const real = new Set(listRoutes(createApp()));
    expect([...documented].filter((r) => !real.has(r))).toEqual([]);
  });
  it('is a valid OpenAPI 3 document with security and components', () => {
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.components.securitySchemes.bearerAuth).toBeTruthy();
    expect(Object.keys(spec.paths).length).toBeGreaterThan(60);
  });
});
