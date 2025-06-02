import { TextPreprocessor } from './textPreprocessor';
import { ReportSection } from './types';

/**
 * Parses blood test reports into logical sections
 */
export class SectionParser {
  // Common section headers in lab reports
  private static readonly SECTION_PATTERNS: Array<{
    name: string;
    patterns: RegExp[];
    priority: number;
  }> = [
    {
      name: 'PATIENT_INFORMATION',
      patterns: [
        /PATIENT\s*INFORMATION/i,
        /PATIENT\s*DETAILS?/i,
        /DEMOGRAPHICS?/i,
      ],
      priority: 1,
    },
    {
      name: 'TEST_RESULTS',
      patterns: [
        /TEST\s*RESULTS?/i,
        /LABORATORY\s*RESULTS?/i,
        /BIOCHEMISTRY/i,
        /HAEMATOLOGY/i,
        /CHEMISTRY/i,
      ],
      priority: 2,
    },
    {
      name: 'REMARKS',
      patterns: [
        /REMARKS?/i,
        /COMMENTS?/i,
        /INTERPRETATION/i,
        /CLINICAL\s*NOTES?/i,
        /PATHOLOGIST\s*COMMENTS?/i,
      ],
      priority: 3,
    },
    {
      name: 'FOOTER',
      patterns: [
        /END\s*OF\s*REPORT/i,
        /REPORT\s*GENERATED/i,
        /LABORATORY\s*SIGNATURE/i,
        /PATHOLOGIST\s*SIGNATURE/i,
      ],
      priority: 4,
    },
  ];

  /**
   * Parse sections from report content
   */
  static parseSections(content: string): Map<string, ReportSection> {
    const cleanedContent = TextPreprocessor.cleanOCRText(content);
    const lines = cleanedContent.split('\n');
    const sections = new Map<string, ReportSection>();
    let currentSection: ReportSection | null = null;
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check if this line is a section header
      const sectionMatch = this.detectSectionHeader(trimmedLine);
      
      if (sectionMatch) {
        // Save previous section if exists
        if (currentSection) {
          sections.set(currentSection.name, { ...currentSection });
        }
        
        // Start new section
        currentSection = {
          name: sectionMatch.name,
          content: '',
          startIndex: lineNumber,
          endIndex: lineNumber,
          confidence: sectionMatch.confidence,
        };
      } else if (currentSection) {
        // Add line to current section
        currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine;
        currentSection.endIndex = lineNumber;
      }
    }

    // Add the last section if it exists
    if (currentSection) {
      sections.set(currentSection.name, currentSection);
    }

    return sections;
  }

  /**
   * Detect if a line is a section header
   */
  private static detectSectionHeader(line: string): { name: string; confidence: number } | null {
    const upperLine = line.toUpperCase();
    
    // Check against known section patterns
    for (const section of this.SECTION_PATTERNS) {
      for (const pattern of section.patterns) {
        if (pattern.test(upperLine)) {
          return {
            name: section.name,
            confidence: 1.0 - (0.1 * section.priority),
          };
        }
      }
    }

    // Check for common section header patterns
    if (/^[A-Z][A-Z\s]+[A-Z](?:\s*[\-:])?$/.test(upperLine)) {
      return {
        name: upperLine.replace(/[\-:]\s*$/, '').trim(),
        confidence: 0.7,
      };
    }

    return null;
  }

  /**
   * Extract patient information section
   */
  static extractPatientInfo(content: string): Record<string, string> {
    const info: Record<string, string> = {};
    const lines = TextPreprocessor.extractCleanLines(content);

    for (const { text } of lines) {
      // Match common patient info patterns
      const nameMatch = text.match(/(?:Patient\s*Name|Name\s*:)\s*(.+)/i);
      const idMatch = text.match(/(?:Patient\s*ID|MRN|ID\s*:)\s*(\S+)/i);
      const dobMatch = text.match(/(?:DOB|Date\s*of\s*Birth)\s*:?\s*([\d\/\-\.]+)/i);
      const genderMatch = text.match(/(?:Sex|Gender)\s*:?\s*(Male|Female|M|F)/i);
      const ageMatch = text.match(/(?:Age)\s*:?\s*(\d+)/i);

      if (nameMatch && !info.name) info.name = nameMatch[1].trim();
      if (idMatch && !info.id) info.id = idMatch[1].trim();
      if (dobMatch && !info.dob) info.dob = dobMatch[1].trim();
      if (genderMatch && !info.gender) info.gender = genderMatch[1].trim();
      if (ageMatch && !info.age) info.age = ageMatch[1].trim();
    }

    return info;
  }

  /**
   * Extract laboratory information
   */
  static extractLabInfo(content: string): Record<string, string> {
    const info: Record<string, string> = {};
    const lines = TextPreprocessor.extractCleanLines(content);

    for (const { text } of lines) {
      const labNameMatch = text.match(/(?:Laboratory|Lab|Provider)\s*:?\s*(.+)/i);
      const dateMatch = text.match(/(?:Report\s*Date|Date\s*:)\s*([\d\/\-\.]+)/i);
      const accMatch = text.match(/(?:Accession|Acc\.?|Report\s*#?)\s*:?\s*(\S+)/i);

      if (labNameMatch && !info.name) info.name = labNameMatch[1].trim();
      if (dateMatch && !info.reportDate) info.reportDate = dateMatch[1].trim();
      if (accMatch && !info.accessionNumber) info.accessionNumber = accMatch[1].trim();
    }

    return info;
  }
}
