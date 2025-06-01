/**
 * Text preprocessing utilities for cleaning and normalizing blood test report text
 */

export class TextPreprocessor {
  // Common OCR errors mapping
  private static readonly OCR_CORRECTIONS: Record<string, string> = {
    // Common OCR mistakes for symbols and spacing - letter-to-number changes are too aggressive here
    // and better handled by OcrNormalizer with more context.
    '\u2013': '-', // en dash to hyphen
    '\u2014': '-', // em dash to hyphen
    '\u2018': "'", // left single quote
    '\u2019': "'", // right single quote
    '\u201c': '"', // left double quote
    '\u201d': '"', // right double quote
    '\u00a0': ' ', // non-breaking space to space
    '\u2022': '-', // bullet to hyphen
    '\u2026': '...', // horizontal ellipsis
  };

  /**
   * Clean and normalize text from OCR or PDF extraction
   */
  static cleanOCRText(text: string): string {
    if (!text) return '';

    // Replace common OCR errors (character substitutions)
    let cleaned = text;
    for (const [error, correction] of Object.entries(this.OCR_CORRECTIONS)) {
      cleaned = cleaned.split(error).join(correction);
    }

    // Normalize line endings to \n FIRST
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Remove control characters except for \n and \t
    // \x00-\x08 (all up to backspace), \x0B (VT), \x0C (FF), \x0E-\x1F (SO to US), \x7F (DEL)
    // This keeps \t (TAB, \x09) and \n (LF, \x0A)
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

    // Process each line
    cleaned = cleaned
      .split('\n')
      .map(line => {
        // For each line, replace multiple spaces/tabs with a single space
        // and then trim leading/trailing whitespace from the line.
        return line.replace(/[ \t\u00A0]+/g, ' ').trim();
      })
      .filter(line => line.length > 0) // Remove any lines that became empty after trimming
      .join('\n'); // Join lines back with a single newline

    return cleaned;
  }

  /**
   * Extract clean lines from text with line numbers
   */
  static extractCleanLines(text: string): Array<{ lineNumber: number; text: string }> {
    if (!text) return [];

    return text
      .split('\n')
      .map((line, index) => ({
        lineNumber: index + 1,
        text: line.trim(),
      }))
      .filter(line => line.text.length > 0);
  }

  /**
   * Normalize whitespace in text
   */
  static normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Remove non-printable characters
   */
  static removeNonPrintable(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/[^\x20-\x7E\n\r\t]/g, '');
  }

  /**
   * Fix common OCR errors in numeric values
   */
  static fixNumericOCR(text: string): string {
    return text
      .replace(/(\d)\s*[,.]\s*(\d)/g, '$1.$2') // Fix decimal points
      .replace(/([a-zA-Z])(\d)/g, '$1 $2') // Add space between letter and number
      .replace(/(\d)([a-zA-Z])/g, '$1 $2'); // Add space between number and letter
  }

  /**
   * Preprocess text before parsing
   */
  static preprocess(text: string): string {
    if (!text) return '';

    return [
      (t: string) => this.removeNonPrintable(t),
      (t: string) => this.cleanOCRText(t), // Now handles per-line whitespace and preserves newlines
      // (t: string) => this.normalizeWhitespace(t), // Removed as it collapses lines; cleanOCRText handles this better per line
      (t: string) => this.fixNumericOCR(t),
    ].reduce((result, fn) => fn(result), text);
  }

  /**
   * Split text into sections based on common section headers
   */
  static splitIntoSections(text: string): Array<{ title: string; content: string }> {
    const sectionRegex = /(?:^|\n)\s*([A-Z][A-Z\s]+[A-Z])\s*[\n:]/g;
    const sections: Array<{ title: string; content: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = sectionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        sections.push({
          title: 'PREAMBLE',
          content: text.substring(lastIndex, match.index).trim(),
        });
      }

      const sectionEnd = sectionRegex.lastIndex;
      const nextMatch = sectionRegex.exec(text);
      const contentEnd = nextMatch ? nextMatch.index : text.length;

      sections.push({
        title: match[1].trim(),
        content: text.substring(sectionEnd, contentEnd).trim(),
      });

      lastIndex = contentEnd;
      if (!nextMatch) break;
    }

    if (lastIndex < text.length) {
      sections.push({
        title: 'FOOTER',
        content: text.substring(lastIndex).trim(),
      });
    }

    return sections;
  }
}
