import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
// Define response type locally to resolve lint errors
interface UploadApiResponse {
  success: boolean;
  file: string;
  testResult: any;
  correlations: any[];
  error?: string;
}
import { PrismaClient } from '@prisma/client';

interface HealthCheckResponse {
  status: string;
}

const CSV_CONTENT = `name,value,unit,min,max,category,testDate,labName,confidence,flags\nGlucose,90,mg/dL,70,99,metabolic,2025-05-01,LabCorp,1.0,flag1;flag2\nVitamin D,30,ng/mL,20,50,vitamin,2025-05-01,Quest,0.95,\nGlucose,100,mg/dL,70,99,metabolic,2025-05-01,LabCorp,1.0,\n`;
const TMP_FILE = path.join(__dirname, 'test-biomarkers.csv');

const prisma = new PrismaClient();
let testUserId: string;

function createTestCsv() {
  fs.writeFileSync(TMP_FILE, CSV_CONTENT, 'utf8');
}

async function waitForServer(retries = 10, delay = 2000): Promise<boolean> {
  console.log('Waiting for server to be ready...');
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch('http://127.0.0.1:3000/api/health'); 
      if (res.ok) {
        const data = (await res.json()) as HealthCheckResponse; 
        if (data.status === 'ok') {
          console.log('Server is ready.');
          return true;
        }
      }
    } catch (e) {
      // console.warn(`Attempt ${i + 1} to connect to server failed:`, e.message);
    }
    console.log(`Attempt ${i + 1} failed, retrying in ${delay / 1000}s...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.error('Server did not become ready in time.');
  return false;
}

describe('API /api/upload integration', () => {
  beforeAll(async () => {
    createTestCsv();
    const serverReady = await waitForServer();
    if (!serverReady) throw new Error('Development server not running. Please start with `npm run dev`');

    const testUser = await prisma.user.upsert({
      where: { email: 'test-user-integration@example.com' },
      update: {},
      create: {
        email: 'test-user-integration@example.com',
        password: 'password123', 
        name: 'Integration Test User',
      },
    });
    testUserId = testUser.id;
    console.log(`Upserted test user with ID: ${testUserId}`);

  }, 30000); 

  afterAll(async () => {
    if (fs.existsSync(TMP_FILE)) {
      fs.unlinkSync(TMP_FILE);
    }
    if (testUserId) {
      await prisma.report.deleteMany({
        where: { userId: testUserId },
      });
      await prisma.user.delete({
        where: { id: testUserId },
      });
      console.log(`Cleaned up test user with ID: ${testUserId} and their reports`);
    }
    await prisma.$disconnect(); 
  });

  it('should upload, parse, and correlate CSV file', async () => {
    const form = new FormData();
    form.append('file', fs.createReadStream(TMP_FILE));
    form.append('userId', testUserId); 
    form.append('type', 'csv');
    console.log('Sending request to upload endpoint...');
    console.log('Headers:', form.getHeaders());
    
    const res = await fetch('http://127.0.0.1:3000/api/upload', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        'Accept': 'application/json',
      },
    });
    
    console.log('Response status:', res.status);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
      throw new Error(`API request failed: ${res.status} ${errorText}`);
    }
    
    const json: UploadApiResponse = await res.json();
    console.log('Full JSON response:', json);
    expect(json.success).toBe(true);
    expect(json.file).toMatch(/test-biomarkers.csv/);
    expect(json.testResult).toBeDefined();
    expect(json.testResult.userId).toBe(testUserId); // Assert correct userId
    expect(json.testResult?.biomarkers.length).toBeGreaterThanOrEqual(2);
    expect(json.correlations).toBeInstanceOf(Array);
  });

  it('should detect strong correlation between Glucose and HbA1c', async () => {
    const correlationCsvPath = path.join(__dirname, 'test-correlation.csv');
    const form = new FormData();
    form.append('file', fs.createReadStream(correlationCsvPath));
    form.append('userId', testUserId);
    form.append('type', 'csv');

    const res = await fetch('http://127.0.0.1:3000/api/upload', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        'Accept': 'application/json',
      },
    });

    expect(res.ok).toBe(true);
    const json: UploadApiResponse = await res.json();
    console.log('Correlation test response:', json);
    console.log('DEBUG biomarkers:', JSON.stringify(json.testResult?.biomarkers, null, 2));
    expect(json.success).toBe(true);
    expect(json.correlations).toBeInstanceOf(Array);
    expect(json.correlations.length).toBeGreaterThan(0);

    // Find correlation between Glucose and HbA1c
    const found = json.correlations.find((c: any) =>
      (c.biomarkerA?.name === 'Glucose' && c.biomarkerB?.name === 'HbA1c') ||
      (c.biomarkerA?.name === 'HbA1c' && c.biomarkerB?.name === 'Glucose')
    );
    expect(found).toBeDefined();
    // Should be strongly positive (close to 1)
    expect(Math.abs(found.coefficient)).toBeGreaterThan(0.95);
  });

  it('should return no correlations for mismatched dates', async () => {
    const csvPath = path.join(__dirname, 'test-correlation-mismatched.csv');
    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath));
    form.append('userId', testUserId);
    form.append('type', 'csv');
    const res = await fetch('http://127.0.0.1:3000/api/upload', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
    }
    expect(res.ok).toBe(true);
    const json: UploadApiResponse = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.correlations)).toBe(true);
    expect(json.correlations.length).toBe(0);
  });

  it('should return no correlations for only one overlapping date', async () => {
    const csvPath = path.join(__dirname, 'test-correlation-single-date.csv');
    const form = new FormData();
    form.append('file', fs.createReadStream(csvPath));
    form.append('userId', testUserId);
    form.append('type', 'csv');
    const res = await fetch('http://127.0.0.1:3000/api/upload', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        'Accept': 'application/json',
      },
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error response:', errorText);
    }
    expect(res.ok).toBe(true);
    const json: UploadApiResponse = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.correlations)).toBe(true);
    expect(json.correlations.length).toBe(0);
  });
}
);
