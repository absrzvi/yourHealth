import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ocr-upload/route';
import * as SecureStorage from '@/lib/storage/secure-storage';
import { getServerSession } from 'next-auth';
import { createMocks } from 'node-mocks-http';
import { FileProcessor } from '@/lib/parsers/fileProcessor';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/storage/secure-storage', () => ({
  storeFile: jest.fn(),
  getStoredFileInfo: jest.fn(),
}));

jest.mock('@/lib/parsers/fileProcessor', () => ({
  FileProcessor: {
    processWithOcr: jest.fn(),
    validateFile: jest.fn(),
  },
}));

describe('OCR Upload API', () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (SecureStorage.storeFile as jest.Mock).mockResolvedValue({
      id: 'file-123',
      path: '/uploads/file-123',
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
    });
    (FileProcessor.validateFile as jest.Mock).mockReturnValue({ valid: true });
    (FileProcessor.processWithOcr as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        biomarkers: [
          { name: 'Glucose', value: '99', unit: 'mg/dL', range: '70-99' },
        ],
      },
    });
  });

  it('returns 401 if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const formData = new FormData();
    formData.append('file', new Blob(['test data'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('type', 'BLOOD_TEST');

    const request = new NextRequest('http://localhost/api/ocr-upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('validates required file input', async () => {
    const formData = new FormData();
    formData.append('type', 'BLOOD_TEST');

    const request = new NextRequest('http://localhost/api/ocr-upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('validates file type', async () => {
    (FileProcessor.validateFile as jest.Mock).mockReturnValue({ 
      valid: false, 
      error: 'Invalid file type' 
    });

    const formData = new FormData();
    formData.append('file', new Blob(['test data'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('type', 'BLOOD_TEST');

    const request = new NextRequest('http://localhost/api/ocr-upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('processes image with OCR successfully', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test data'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('type', 'BLOOD_TEST');

    const request = new NextRequest('http://localhost/api/ocr-upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(FileProcessor.processWithOcr).toHaveBeenCalled();
    expect(SecureStorage.storeFile).toHaveBeenCalled();
  });

  it('handles OCR processing errors', async () => {
    (FileProcessor.processWithOcr as jest.Mock).mockRejectedValue(
      new Error('OCR processing failed')
    );

    const formData = new FormData();
    formData.append('file', new Blob(['test data'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('type', 'BLOOD_TEST');

    const request = new NextRequest('http://localhost/api/ocr-upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it('stores file securely with correct user ID', async () => {
    const formData = new FormData();
    formData.append('file', new Blob(['test data'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('type', 'BLOOD_TEST');

    const request = new NextRequest('http://localhost/api/ocr-upload', {
      method: 'POST',
      body: formData,
    });

    await POST(request);
    
    expect(SecureStorage.storeFile).toHaveBeenCalledWith(
      expect.any(Object),
      mockSession.user.id
    );
  });

  it('sends appropriate HIPAA access logs', async () => {
    // Mock logging functionality
    const mockLogAccess = jest.spyOn(SecureStorage, 'getStoredFileInfo');
    
    const formData = new FormData();
    formData.append('file', new Blob(['test data'], { type: 'image/jpeg' }), 'test.jpg');
    formData.append('type', 'BLOOD_TEST');

    const request = new NextRequest('http://localhost/api/ocr-upload', {
      method: 'POST',
      body: formData,
    });

    await POST(request);
    
    // Verify logging was called
    expect(mockLogAccess).toHaveBeenCalled();
  });
});
