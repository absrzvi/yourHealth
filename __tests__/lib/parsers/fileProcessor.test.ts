import { FileProcessor } from '@/lib/parsers/fileProcessor';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              biomarkers: [
                { name: 'Glucose', value: '99', unit: 'mg/dL', range: '70-99' },
                { name: 'Cholesterol', value: '180', unit: 'mg/dL', range: '130-200' }
              ]
            })
          }
        })
      })
    }))
  };
});

describe('FileProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFile', () => {
    it('should validate a proper file', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const result = FileProcessor.validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject files that are too large', () => {
      // Create a mock file with size exceeding the limit
      const mockFile = {
        name: 'large.pdf',
        type: 'application/pdf',
        size: 15 * 1024 * 1024 // 15MB
      } as File;
      
      const result = FileProcessor.validateFile(mockFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should reject files with invalid types', () => {
      const file = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });
      const result = FileProcessor.validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });
  });

  describe('needsOcrProcessing', () => {
    it('should identify image files for OCR processing', () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      const result = FileProcessor.needsOcrProcessing(imageFile);
      expect(result).toBe(true);
    });

    it('should identify small PDFs for OCR processing', () => {
      // Create a mock file that's small enough to be considered a scanned document
      const mockPdfFile = {
        name: 'scan.pdf',
        type: 'application/pdf',
        size: 2 * 1024 * 1024 // 2MB
      } as File;
      
      const result = FileProcessor.needsOcrProcessing(mockPdfFile);
      expect(result).toBe(true);
    });

    it('should not use OCR for structured data files', () => {
      const csvFile = new File(['data,more data'], 'test.csv', { type: 'text/csv' });
      const result = FileProcessor.needsOcrProcessing(csvFile);
      expect(result).toBe(false);
    });
  });

  describe('processWithOcr', () => {
    it('should process image files using AI and extract biomarkers', async () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await FileProcessor.processWithOcr(imageFile);
      
      expect(result.success).toBe(true);
      expect(result.data?.biomarkers).toHaveLength(2);
      expect(result.data?.biomarkers[0].name).toBe('Glucose');
      expect(result.data?.biomarkers[0].value).toBe('99');
    });

    it('should handle OCR processing errors gracefully', async () => {
      // Mock implementation that throws an error
      (GoogleGenerativeAI as jest.Mock).mockImplementationOnce(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('AI processing failed'))
        })
      }));
      
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      
      try {
        await FileProcessor.processWithOcr(imageFile);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('failed');
      }
    });
  });

  describe('processFile', () => {
    it('should route image files to OCR processing', async () => {
      const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      
      // Create a spy on the processWithOcr method
      const processSpy = jest.spyOn(FileProcessor, 'processWithOcr');
      
      await FileProcessor.processFile(imageFile);
      
      expect(processSpy).toHaveBeenCalledWith(imageFile);
    });

    it('should reject invalid files', async () => {
      const invalidFile = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });
      
      try {
        await FileProcessor.processFile(invalidFile);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('Invalid');
      }
    });
  });
});
