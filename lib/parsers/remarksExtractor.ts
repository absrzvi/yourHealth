import { v4 as uuidv4 } from 'uuid';
import { Remark, ExtractedBiomarker } from './types';
import { BIOMARKER_DICTIONARY } from './biomarkerDictionary';
import { TextPreprocessor } from './textPreprocessor';

/**
 * Extracts clinical remarks and interpretations from blood test reports
 */
export class RemarksExtractor {
  private static readonly MAX_REMARKS_TOTAL_LENGTH = 5 * 1024 * 1024; // 5MB
  private static readonly MAX_SINGLE_OPERATION_INCREASE = 100 * 1024; // 100KB

  // Disabled debug logging
  private static logLength(label: string, text: string | undefined | null, operation?: string): number {
    return text?.length || 0;
  }

  // Disabled critical expansion check
  private static checkCriticalExpansion(label: string, newLength: number, oldLength: number, operation: string) {
    // Check is still performed but logging is disabled
    const change = newLength - oldLength;
    if (change > this.MAX_SINGLE_OPERATION_INCREASE || newLength > this.MAX_REMARKS_TOTAL_LENGTH) {
      // Silent check - logging disabled
    }
  }

  /**
   * Extract remarks from report content
   */
  static extractRemarks(
    content: string,
    biomarkers: ExtractedBiomarker[] = []
  ): { remarks: Remark[]; updatedBiomarkers: ExtractedBiomarker[] } {
    // Disabled debug logging
    const cleanedContent = TextPreprocessor.cleanOCRText(content);
    const sections = this.splitIntoSections(cleanedContent);
    
    // Extract remarks from different sections
    const sectionRemarks = this.extractSectionRemarks(sections);
    const footerRemarks = this.extractFooterRemarks(sections);
    const inlineRemarks = this.extractInlineRemarks(cleanedContent);
    
    // Combine all remarks
    let allRemarks = [...sectionRemarks, ...footerRemarks, ...inlineRemarks];
    
    // Remove duplicates
    allRemarks = this.removeDuplicateRemarks(allRemarks);
    
    // Associate remarks with biomarkers
    const { remarks, updatedBiomarkers } = this.associateRemarksWithBiomarkers(allRemarks, biomarkers);

    return {
      remarks,
      updatedBiomarkers,
    };
  }

  /**
   * Split content into sections based on common headers
   */
  private static splitIntoSections(content: string): Array<{
    name: string;
    content: string;
    type: 'header' | 'footer' | 'body';
  }> {
    const sections: Array<{
      name: string;
      content: string;
      type: 'header' | 'footer' | 'body';
    }> = [];
    
    // Common section headers
    const sectionPatterns = [
      { name: 'REMARKS', regex: /^\s*REMARKS?:?\s*$/im },
      { name: 'INTERPRETATION', regex: /^\s*INTERPRETATION:?\s*$/im },
      { name: 'COMMENTS', regex: /^\s*COMMENTS?:?\s*$/im },
      { name: 'IMPRESSION', regex: /^\s*IMPRESSION:?\s*$/im },
      { name: 'CONCLUSION', regex: /^\s*CONCLUSION:?\s*$/im },
      { name: 'FOOTER', regex: /^\s*(?:REPORT END|END OF REPORT|LABORATORY SIGNATURE)/im },
    ];
    
    let currentSection: { name: string; content: string; type: 'header' | 'footer' | 'body' } = { name: 'HEADER', content: '', type: 'header' };
    let lastIndex = 0;
    
    // Find all section matches
    const matches: Array<{ name: string; index: number }> = [];
    
    for (const pattern of sectionPatterns) {
      const regex = new RegExp(pattern.regex);
      let match;
      while ((match = regex.exec(content)) !== null) {
        matches.push({
          name: pattern.name,
          index: match.index,
        });
      }
    }
    
    // Sort matches by position
    matches.sort((a, b) => a.index - b.index);
    
    // Process each section
    for (const match of matches) {
      // Add content before this section
      if (match.index > lastIndex) {
        currentSection.content = content.substring(lastIndex, match.index).trim();
        if (currentSection.content) {
          sections.push({ ...currentSection });
        }
      }
      
      // Update current section
      currentSection = {
        name: match.name,
        content: '',
        type: match.name === 'FOOTER' ? 'footer' : 'body',
      };
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining content
    if (lastIndex < content.length) {
      currentSection.content = content.substring(lastIndex).trim();
      if (currentSection.content) {
        sections.push({ ...currentSection });
      }
    }
    
    return sections;
  }

  /**
   * Extract remarks from section content
   */
  private static extractSectionRemarks(
    sections: Array<{ name: string; content: string; type: string }>
  ): Remark[] {
    const remarks: Remark[] = [];
    
    for (const section of sections) {
      RemarksExtractor.logLength(`extractSectionRemarks processing section '${section.name}'`, section.content);
      if (!['REMARKS', 'COMMENTS', 'INTERPRETATION', 'IMPRESSION', 'CONCLUSION'].includes(section.name)) {
        continue;
      }
      
      const lines = section.content.split('\n').filter(line => line.trim());
      let currentRemark: string[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) continue;
        
        // Check if this line starts a new remark
        if (this.isNewRemarkLine(trimmedLine) && currentRemark.length > 0) {
          this.addRemark(remarks, currentRemark.join(' '), section.name);
          currentRemark = [];
        }
        
        currentRemark.push(trimmedLine);
      }
      
      // Add the last remark if exists
      if (currentRemark.length > 0) {
        this.addRemark(remarks, currentRemark.join(' '), section.name);
      }
    }
    
    return remarks;
  }

  /**
   * Extract remarks from footer section
   */
  private static extractFooterRemarks(
    sections: Array<{ name: string; content: string; type: string }>
  ): Remark[] {
    const remarks: Remark[] = [];
    const footer = sections.find(s => s.type === 'footer');
    
    if (!footer) return [];
    
    // Common footer patterns that might contain remarks
    const footerPatterns = [
      /(?:interpretation|comment|remark)[:\s]*(.+)/i,
      /(?:note|notice|warning)[:\s]*(.+)/i,
    ];
    
    const lines = footer.content.split('\n');
    
    for (const line of lines) {
      for (const pattern of footerPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          this.addRemark(remarks, match[1].trim(), footer.name);
          break;
        }
      }
    }
    
    return remarks;
  }

  /**
   * Extract inline remarks from the content
   */
  private static extractInlineRemarks(content: string): Remark[] {
    const remarks: Remark[] = [];
    
    // Patterns for inline remarks
    const inlinePatterns = [
      // Pattern: [remark]
      /\[([^\]]+)\]/g,
      // Pattern: *remark*
      /\*([^*]+)\*/g,
      // Pattern: "remark"
      /"([^"]+)"/g,
      // Pattern: 'remark'
      /'([^']+)'/g,
    ];
    
    for (const pattern of inlinePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const text = match[1] || match[0];
        if (text.length > 10 && text.length < 500) { // Reasonable length for a remark
          this.addRemark(remarks, text, 'INLINE');
        }
      }
    }
    
    return remarks;
  }

  /**
   * Check if a line starts a new remark
   */
  private static isNewRemarkLine(line: string): boolean {
    // Check for numbered or bullet points
    return /^\s*[\-•*]\s+/.test(line) || // Bullet points
           /^\s*\d+[.)]\s+/.test(line) || // Numbered lists (1. or 1))
           /^\s*[A-Z][A-Z\s]+:/.test(line); // UPPERCASE words followed by colon
  }

  /**
   * Add a remark to the list if it's meaningful
   */
  private static addRemark(
    remarks: Remark[],
    text: string,
    section: string
  ): void {
    const trimmedText = text.trim();
    
    // Skip empty or very short remarks
    if (trimmedText.length < 10) return;
    
    // Skip common false positives
    const skipPatterns = [
      /^[\s\d\W]+$/, // No letters
      /^[A-Z\s]+$/, // All caps (likely a header)
      /^[\w\s]+:$/, // Just a label
      /^[\w\s]+\s+[A-Z][\w\s]+$/, // Just a name
    ];
    
    if (skipPatterns.some(p => p.test(trimmedText))) {
      return;
    }
    
    // Determine remark type
    const type = this.determineRemarkType(trimmedText);
    
    // Extract keywords
    const keywords = this.extractKeywords(trimmedText);
    
    remarks.push({
      id: `rmk_${uuidv4()}`,
      type,
      content: trimmedText,
      section,
      confidence: 0.8, // Base confidence
      source: 'direct',
      keywords,
    });
  }

  /**
   * Determine the type of remark
   */
  private static determineRemarkType(text: string): Remark['type'] {
    const lowerText = text.toLowerCase();
    
    // Check for interpretation patterns
    if (/(?:suggestive of|consistent with|indicative of|likely|possibly|probably)/i.test(lowerText)) {
      return 'interpretation';
    }
    
    // Check for recommendation patterns
    if (/(?:recommend|suggest|advise|consider|follow[ -]?up|repeat|retest)/i.test(lowerText)) {
      return 'recommendation';
    }
    
    // Check for biomarker-specific patterns
    if (Object.keys(BIOMARKER_DICTIONARY).some(key => 
      new RegExp(`\\b${key}\\b`, 'i').test(lowerText)
    )) {
      return 'biomarker';
    }
    
    // Default to general
    return 'general';
  }

  /**
   * Extract keywords from remark text
   */
  private static extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Add biomarker names if mentioned
    for (const [key, def] of Object.entries(BIOMARKER_DICTIONARY)) {
      const patterns = [def.standardName.toLowerCase(), ...def.aliases];
      if (patterns.some(alias => 
        new RegExp(`\\b${alias}\\b`, 'i').test(lowerText)
      )) {
        keywords.push(def.standardName);
      }
    }
    
    // Add status keywords
    const statusWords = [
      'elevated', 'increased', 'high', 'low', 'decreased', 'abnormal',
      'normal', 'within range', 'borderline', 'critical', 'deficiency',
      'insufficiency', 'elevation', 'reduction', 'elevations', 'reductions'
    ];
    
    for (const word of statusWords) {
      if (lowerText.includes(word)) {
        keywords.push(word);
      }
    }
    
    return Array.from(new Set(keywords)); // Remove duplicates
  }

  /**
   * Remove duplicate remarks
   */
  private static removeDuplicateRemarks(remarks: Remark[]): Remark[] {
    const unique = new Map<string, Remark>();
    
    for (const remark of remarks) {
      // Normalize text for comparison
      const normalized = remark.content
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (!unique.has(normalized)) {
        unique.set(normalized, remark);
      } else {
        // Keep the one with higher confidence or more information
        const existing = unique.get(normalized)!;
        if (remark.confidence > existing.confidence || 
            (remark.keywords && !existing.keywords)) {
          unique.set(normalized, remark);
        }
      }
    }
    
    const finalRemarks = Array.from(unique.values());
    return finalRemarks;
  }

  /**
   * Associate remarks with biomarkers
   */
  private static associateRemarksWithBiomarkers(
    remarks: Remark[],
    biomarkers: ExtractedBiomarker[]
  ): { remarks: Remark[]; updatedBiomarkers: ExtractedBiomarker[] } {
    const updatedRemarks = [...remarks];
    const updatedBiomarkers = [...biomarkers];
    
    // Create a map of biomarker names to their indices
    const biomarkerMap = new Map<string, number>();
    biomarkers.forEach((bm, index) => {
      biomarkerMap.set(bm.standardName.toLowerCase(), index);
      if (bm.name.toLowerCase() !== bm.standardName.toLowerCase()) {
        biomarkerMap.set(bm.name.toLowerCase(), index);
      }
    });
    
    // Process each remark
    for (let i = 0; i < updatedRemarks.length; i++) {
      const remark = updatedRemarks[i];
      const associatedBiomarkers: string[] = [];
      
      // Check for biomarker mentions in the remark
      for (const [bmName, bmIndex] of Array.from(biomarkerMap.entries())) {
        const regex = new RegExp(`\\b${bmName}\\b`, 'i');
        if (regex.test(remark.content.toLowerCase())) {
          const standardName = updatedBiomarkers[bmIndex].standardName;
          if (!associatedBiomarkers.includes(standardName)) {
            associatedBiomarkers.push(standardName);
            
            // Add remark ID to biomarker
            if (!updatedBiomarkers[bmIndex].remarkIds) {
              updatedBiomarkers[bmIndex].remarkIds = [];
            }
            updatedBiomarkers[bmIndex].remarkIds!.push(remark.id);
          }
        }
      }
      
      // Update remark with associated biomarkers
      if (associatedBiomarkers.length > 0) {
        updatedRemarks[i] = {
          ...remark,
          associatedBiomarkers,
        };
      }
    }
    
    return {
      remarks: updatedRemarks,
      updatedBiomarkers,
    };
  }
}
