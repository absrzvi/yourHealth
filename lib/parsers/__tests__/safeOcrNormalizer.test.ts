import { SafeOcrNormalizer, OcrNormalizer } from '../ocrNormalizer';

describe('SafeOcrNormalizer', () => {
  let normalizer: SafeOcrNormalizer;

  beforeEach(() => {
    normalizer = new SafeOcrNormalizer();
    // Clear any mocks before each test
    jest.restoreAllMocks();
  });

  describe('normalize method (public API)', () => {
    it('should return empty string for empty input', () => {
      expect(normalizer.normalize('')).toBe('');
    });

    it('should handle normalization of small text blocks directly', () => {
      const inputText = 'Test text with m g/dl value.';
      
      // Mock normalize method to test that it's called for small texts
      const normalizeSpy = jest.spyOn(OcrNormalizer, 'normalize');
      normalizeSpy.mockImplementation((text) => text.replace('m g/dl', 'mg/dL'));
      
      const result = normalizer.normalize(inputText);
      
      expect(normalizeSpy).toHaveBeenCalledWith(inputText);
      expect(result).toBe('Test text with mg/dL value.');
    });

    it('should process large content in chunks', () => {
      // Create a text larger than the max chunk size (5000 chars)
      const largeText = 'a'.repeat(6000);
      
      // Mock the normalize method
      const normalizeSpy = jest.spyOn(OcrNormalizer, 'normalize');
      normalizeSpy.mockImplementation((text) => text);
      
      // Mock the clearCache method to verify it's called between chunks
      const clearCacheSpy = jest.spyOn(OcrNormalizer, 'clearCache');
      clearCacheSpy.mockImplementation(() => {});
      
      normalizer.normalize(largeText);
      
      // Should be called more than once due to chunking
      expect(normalizeSpy.mock.calls.length).toBeGreaterThan(1);
      // Should clear cache between chunks
      expect(clearCacheSpy).toHaveBeenCalled();
    });

    it('should preserve content even when normalization results in empty string', () => {
      const inputText = 'Test preservation of content';
      
      // Mock normalize to return empty string to test the safety check
      const normalizeSpy = jest.spyOn(OcrNormalizer, 'normalize');
      normalizeSpy.mockImplementation(() => '');
      
      const result = normalizer.normalize(inputText);
      
      // Should return the original input when normalized content would be empty
      expect(result).toBe(inputText);
    });

    it('should join normalized chunks with double newlines', () => {
      // Force chunking by using text with paragraph breaks
      const textWithParagraphs = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3';
      
      // Mock dependencies to return predictable results
      const splitSpy = jest.spyOn(SafeOcrNormalizer.prototype as any, 'splitIntoChunks');
      splitSpy.mockImplementation(() => ['Paragraph 1', 'Paragraph 2', 'Paragraph 3']);
      
      const normalizeSpy = jest.spyOn(OcrNormalizer, 'normalize');
      normalizeSpy.mockImplementation((text) => text);
      
      const result = normalizer.normalize(textWithParagraphs);
      
      // Verify chunks are joined with double newlines
      expect(result).toBe('Paragraph 1\n\nParagraph 2\n\nParagraph 3');
    });
  });

  describe('splitIntoChunks method', () => {
    it('should split text at paragraph boundaries when possible', () => {
      // Access the private method using type casting
      const splitIntoChunks = (normalizer as any).splitIntoChunks.bind(normalizer);
      
      const text = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3';
      const chunks = splitIntoChunks(text, 20);
      
      expect(chunks.length).toBe(3);
      expect(chunks[0]).toBe('Paragraph 1');
      expect(chunks[1]).toBe('Paragraph 2');
      expect(chunks[2]).toBe('Paragraph 3');
    });

    it('should fall back to size-based splitting if no paragraph boundaries', () => {
      // Access the private method using type casting
      const splitIntoChunks = (normalizer as any).splitIntoChunks.bind(normalizer);
      
      const text = 'A'.repeat(100);
      const chunks = splitIntoChunks(text, 30);
      
      expect(chunks.length).toBe(4);
      expect(chunks[0].length).toBe(30);
      expect(chunks[1].length).toBe(30);
      expect(chunks[2].length).toBe(30);
      expect(chunks[3].length).toBe(10);
    });
  });
});
