# Report Parsing System

## Overview
The report parsing system is designed to handle various health report formats including blood tests, DNA, and microbiome analysis. It provides a flexible and extensible framework for parsing different file types and extracting structured health data.

## Architecture

### Core Components

#### 1. Parser Factory (`lib/parsers/parserFactory.ts`)
- Dynamically creates the appropriate parser based on file content
- Detects report types (BLOOD_TEST, DNA, MICROBIOME)
- Provides a clean interface for parsing different report formats

#### 2. File Processor (`lib/parsers/fileProcessor.ts`)
- Handles file reading and type detection
- Supports multiple file types (PDF, Excel, CSV, TSV, JSON)
- Includes file validation and size limits
- Processes multiple files in parallel

#### 3. DNA Parser (`lib/parsers/dnaParser.ts`)
- Handles various DNA report formats (23andMe, AncestryDNA, VCF)
- Extracts genetic variants with rsIDs, genotypes, and significance
- Includes mappings for common genetic variants

#### 4. Microbiome Parser (`lib/parsers/microbiomeParser.ts`)
- Processes microbiome analysis reports
- Supports multiple formats (CSV, TSV, JSON)
- Identifies beneficial vs. potentially harmful bacteria

#### 5. Blood Test Parser (`lib/parsers/bloodTestParser.ts`)
- Parses blood test results in various formats
- Extracts biomarker values and reference ranges
- Identifies out-of-range values

## Usage

### Basic Usage

```typescript
import { FileProcessor } from '@/lib/parsers';

// Process a single file
const result = await FileProcessor.processFile(file);

// Process multiple files
const { results, successCount, errorCount } = await FileProcessor.processMultipleFiles(files);
```

### File Validation

```typescript
// Validate a file before processing
const validation = FileProcessor.validateFile(file, maxSizeMB);
if (!validation.valid) {
  console.error(validation.error);
  return;
}
```

### Getting File Type

```typescript
const fileType = FileProcessor.getFileType(file);
console.log(`File type: ${fileType}`);
```

## Error Handling
The system provides comprehensive error handling with detailed error messages for common issues:
- Invalid file types
- File size limits exceeded
- Parsing errors
- Missing or malformed data

## Extending the System

### Adding a New Parser
1. Create a new parser class that extends `BaseParser`
2. Implement the required parsing logic
3. Update the `parserFactory.ts` to include the new parser
4. Add the new parser to the exports in `index.ts`

### Example Parser Implementation

```typescript
import { BaseParser } from './baseParser';
import { ParserResult } from './types';

export class NewReportParser extends BaseParser<NewReportData> {
  async parse(): Promise<ParserResult> {
    try {
      // Parse the file content
      const data = this.parseContent();
      
      return this.success({
        type: 'NEW_TYPE',
        // Parsed data
        metadata: {
          parsedAt: new Date().toISOString(),
          source: this.file.name
        }
      });
    } catch (error) {
      console.error('Error parsing report:', error);
      return this.error('Failed to parse report');
    }
  }
  
  private parseContent() {
    // Custom parsing logic
  }
}
```

## Security Considerations
- All file processing happens on the client side
- Sensitive data is never stored or transmitted without encryption
- File size limits are enforced to prevent DoS attacks
- Input validation is performed on all file contents

## Performance
- Large files are processed in chunks to prevent UI freezing
- PDF and Excel parsing is done asynchronously
- Memory usage is optimized for large datasets

## Testing
Unit tests cover:
- File type detection
- Parser factory
- Individual parser implementations
- Error handling
- Edge cases

## Dependencies
- `pdfjs-dist`: For PDF parsing
- `xlsx`: For Excel file parsing
- `csv-parse`: For CSV/TSV parsing

## Future Improvements
1. Add support for more report formats
2. Implement server-side processing for large files
3. Add more comprehensive error recovery
4. Improve performance for very large files
