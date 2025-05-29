import { Biomarker } from '../../types/health';
import { BaseParser } from './BaseParser';

export class QuestBloodTestParser extends BaseParser {
  private currentSection: string = '';
  private readonly SECTION_HEADERS = [
    'COMPLETE BLOOD COUNT',
    'COMPREHENSIVE METABOLIC PANEL',
    'LIPID PANEL',
    'THYROID PANEL',
    'INFLAMMATORY MARKERS',
    'VITAMINS AND MINERALS',
    'HORMONES',
    'ADDITIONAL MARKERS'
  ];

  async parse(content: string): Promise<Biomarker[]> {
    const lines = content.split('\n');
    const biomarkers: Biomarker[] = [];
    let collectionDate: Date | null = null;
    
    // Parse collection date if available
    const dateMatch = content.match(/Collection Date: (\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
      const [_, dateStr] = dateMatch;
      collectionDate = new Date(dateStr);
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for section headers
      const sectionHeader = this.SECTION_HEADERS.find(header => 
        line.toUpperCase().startsWith(header)
      );
      
      if (sectionHeader) {
        this.currentSection = sectionHeader;
        continue;
      }
      
      // Skip empty lines or lines without test results
      if (!line || line.includes('Test') || line.includes('Result') || line.includes('---')) {
        continue;
      }
      
      // Parse test result line
      const testMatch = line.match(/^([^\d<>=]+?)\s+([\d.<>=]+)(?:\s+([^\d\s]+)?(?:\s+([\d.-]+(?:\s*-\s*[\d.-]+)?))?\s*([^\d\s]*))?$/);
      
      if (testMatch) {
        const [_, name, value, flag, range, unit] = testMatch;
        const trimmedName = name.trim();
        
        if (!trimmedName) continue;
        
        try {
          const numericValue = this.normalizeValue(value);
          let referenceRange = null;
          
          if (range) {
            const rangeParts = range.split(/\s*-\s*/);
            if (rangeParts.length === 2) {
              referenceRange = {
                min: parseFloat(rangeParts[0]),
                max: parseFloat(rangeParts[1]),
                unit: unit || ''
              };
            }
          }
          
          const flagValue = flag?.trim() || null;
          let flagged: 'high' | 'low' | 'normal' | undefined;
          
          if (flagValue) {
            if (flagValue === 'H') flagged = 'high';
            else if (flagValue === 'L') flagged = 'low';
            else flagged = 'normal';
          }
          
          biomarkers.push({
            name: trimmedName,
            value: numericValue,
            unit: unit?.trim() || '',
            referenceRange,
            flag: flagValue,
            flagged,
            date: collectionDate || new Date(),
            source: 'QUEST_BLOOD_TEST',
            category: this.currentSection || 'UNCATEGORIZED'
          });
        } catch (error) {
          console.warn(`Skipping invalid test result: ${line}`, error);
        }
      }
    }
    
    return biomarkers;
  }
}
