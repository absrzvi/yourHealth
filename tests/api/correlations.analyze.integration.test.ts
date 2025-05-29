import { describe, it, expect } from 'vitest';
import { createServer } from 'http';
import fetch from 'node-fetch';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: process.cwd() });
const handle = app.getRequestHandler();

const PORT = 3100;

const bloodTestCSV = `name,value,unit,reference_range\nWBC,5.2,x10^9/L,4.0-11.0 x10^9/L\nRBC,4.7,x10^12/L,4.2-5.9 x10^12/L\nHGB,13.8,g/dL,13.0-17.0 g/dL\nGLUCOSE,89,mg/dL,70-99 mg/dL`;
const dnaCSV = `rsid,chromosome,position,genotype\nrs9939609,16,53786615,AA\nrs662799,11,116792662,AG\nrs1801133,1,11856378,GG\nrs429358,19,45411941,GA`;
const microbiomeJSON = JSON.stringify({
  sample_date: '2024-05-01',
  bacteria: [
    { taxon: 'Bacteroides', abundance: 0.23 },
    { taxon: 'Firmicutes', abundance: 0.45 }
  ]
});

describe('POST /api/correlations/analyze', () => {
  let server: any;

  beforeAll(async () => {
    await app.prepare();
    server = createServer((req, res) => handle(req, res));
    await new Promise(resolve => server.listen(PORT, resolve));
  });

  afterAll(() => {
    server.close();
  });

  it('analyzes blood test CSV', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/correlations/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: bloodTestCSV,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.correlations)).toBe(true);
  });

  it('analyzes DNA CSV', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/correlations/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: dnaCSV,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.correlations)).toBe(true);
  });

  it('analyzes microbiome JSON', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/correlations/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: microbiomeJSON,
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.correlations)).toBe(true);
  });

  it('returns 400 for unknown format', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/correlations/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'garbage data',
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
