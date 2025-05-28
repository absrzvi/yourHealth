// Factory for selecting the appropriate parser based on file type
import { CsvParser } from './csv.parser';
import { PdfParser } from './pdf.parser';
import { Parser } from './base.parser';

export function getParser(fileType: string): Parser {
  switch (fileType) {
    case 'csv':
      return new CsvParser();
    case 'pdf':
      return new PdfParser();
    default:
      throw new Error(`No parser available for file type: ${fileType}`);
  }
}
