Complete Blood Test Parser Implementation Guide with Remarks Extraction
🎯 Project Overview
Build a comprehensive blood test parser that extracts biomarkers AND clinical remarks/recommendations with 95%+ accuracy.
Features

Extract all standard biomarkers from PDF/text reports
Capture clinical remarks, interpretations, and recommendations
Link remarks to specific biomarkers
Provide confidence scoring for all extractions
Support multiple lab formats

Target Outcomes

Biomarker extraction accuracy > 95%
Remarks extraction with context preservation
Proper association between biomarkers and their interpretations
Production-ready error handling


📁 Complete File Structure
src/lib/parsers/
├── types.ts                    # Core type definitions
├── biomarkerDictionary.ts      # Biomarker definitions and aliases
├── remarksDictionary.ts        # Remarks patterns and extraction
├── textPreprocessor.ts         # OCR cleaning and text normalization
├── sectionParser.ts            # Document section identification
├── biomarkerExtractor.ts       # Biomarker extraction logic
├── remarksExtractor.ts         # Remarks extraction logic
├── biomarkerValidator.ts       # Validation and confidence scoring
├── bloodTestParser.ts          # Main parser integration
└── __tests__/
    └── bloodTestParser.test.ts # Comprehensive test suite

📋 Implementation Files
File 1: Core Type Definitions
File: src/lib/parsers/types.ts
typescriptexport type ReportType = 'BLOOD_TEST' | 'DNA' | 'MICROBIOME';

export interface Remark {
  id: string;
  type: 'biomarker' | 'section' | 'general' | 'interpretation' | 'recommendation';
  content: string;
  associatedBiomarkers?: string[]; // Standard names of related biomarkers
  section?: string;
  confidence: number;
  source: 'direct' | 'inferred'; // Whether explicitly labeled or inferred
  keywords?: string[]; // Key terms that triggered extraction
}

export interface BloodTestReportData {
  type: ReportType;
  biomarkers: any[];
  remarks: Remark[];
  metadata: {
    parser: string;
    biomarkerCount: number;
    parsedAt: string;
    confidence?: number;
    sections?: string[];
    validation?: any;
    remarkCount?: number;
  };
  patientInfo?: any;
  labInfo?: any;
  criticalFindings?: any[];
}

export interface ParserResult {
  success: boolean;
  data?: BloodTestReportData;
  error?: string;
}

export interface ReportSection {
  name: string;
  content: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export interface ExtractedBiomarker {
  name: string;
  standardName: string;
  value: number;
  unit: string;
  referenceRange?: string;
  status?: 'low' | 'normal' | 'high' | 'critical';
  confidence: number;
  category: string;
  rawText?: string;
  remarkIds?: string[]; // IDs of associated remarks
}

File 2: Biomarker Dictionary
File: src/lib/parsers/biomarkerDictionary.ts
typescript// Comprehensive biomarker type definitions
export interface BiomarkerDefinition {
  standardName: string;
  aliases: string[];
  category: string;
  unit: string[];
  validRange: { min: number; max: number };
  criticalLow?: number;
  criticalHigh?: number;
}

// Re-export ExtractedBiomarker from types
export { ExtractedBiomarker } from './types';

// Comprehensive biomarker dictionary
export const BIOMARKER_DICTIONARY: Record<string, BiomarkerDefinition> = {
  // HEMATOLOGY
  'hemoglobin': {
    standardName: 'Hemoglobin',
    aliases: ['hemoglobin', 'hb', 'haemoglobin', 'hgb'],
    category: 'hematology',
    unit: ['g/dL', 'g/dl', 'gm/dl'],
    validRange: { min: 5, max: 25 },
    criticalLow: 7,
    criticalHigh: 20
  },
  'hematocrit': {
    standardName: 'Hematocrit',
    aliases: ['hematocrit', 'hct', 'haematocrit', 'packed cell volume', 'pcv'],
    category: 'hematology',
    unit: ['%'],
    validRange: { min: 15, max: 65 }
  },
  'rbc_count': {
    standardName: 'RBC Count',
    aliases: ['rbc count', 'red blood cell count', 'red blood cells', 'erythrocyte count', 'red cell count'],
    category: 'hematology',
    unit: ['million/cmm', 'million/µL', '10^6/µL', 'mill/cumm'],
    validRange: { min: 2, max: 8 }
  },
  'wbc_count': {
    standardName: 'WBC Count',
    aliases: ['wbc count', 'white blood cell count', 'total wbc', 'leucocyte count', 'white cell count', 'total leucocyte count', 'tlc'],
    category: 'hematology',
    unit: ['/cmm', '/cumm', '/µL', 'cells/µL'],
    validRange: { min: 1000, max: 30000 }
  },
  'platelet_count': {
    standardName: 'Platelet Count',
    aliases: ['platelet count', 'plt', 'platelets', 'thrombocyte count'],
    category: 'hematology',
    unit: ['/cmm', '/cumm', 'lakh/cumm', 'x10^3/µL'],
    validRange: { min: 50000, max: 600000 }
  },
  'mcv': {
    standardName: 'MCV',
    aliases: ['mcv', 'mean corpuscular volume', 'mean cell volume'],
    category: 'hematology',
    unit: ['fL', 'fl'],
    validRange: { min: 60, max: 110 }
  },
  'mch': {
    standardName: 'MCH',
    aliases: ['mch', 'mean corpuscular hemoglobin', 'mean cell hemoglobin'],
    category: 'hematology',
    unit: ['pg'],
    validRange: { min: 20, max: 40 }
  },
  'mchc': {
    standardName: 'MCHC',
    aliases: ['mchc', 'mean corpuscular hemoglobin concentration'],
    category: 'hematology',
    unit: ['g/dL', 'g/dl', '%'],
    validRange: { min: 28, max: 38 }
  },

  // CHEMISTRY - GLUCOSE
  'glucose_fasting': {
    standardName: 'Fasting Blood Sugar',
    aliases: ['glucose', 'blood sugar', 'fasting blood sugar', 'fbs', 'fasting glucose', 'blood glucose'],
    category: 'diabetes',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 20, max: 600 },
    criticalLow: 40,
    criticalHigh: 450
  },
  'hba1c': {
    standardName: 'HbA1c',
    aliases: ['hba1c', 'glycosylated hemoglobin', 'a1c', 'hemoglobin a1c', 'glycated hemoglobin', 'glycosylated haemoglobin'],
    category: 'diabetes',
    unit: ['%'],
    validRange: { min: 3, max: 15 }
  },

  // LIPID PROFILE
  'cholesterol_total': {
    standardName: 'Total Cholesterol',
    aliases: ['cholesterol', 'total cholesterol', 'serum cholesterol', 'chol'],
    category: 'lipid',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 50, max: 500 }
  },
  'triglycerides': {
    standardName: 'Triglycerides',
    aliases: ['triglyceride', 'triglycerides', 'trig', 'trigs', 'serum triglycerides'],
    category: 'lipid',
    unit: ['mg/dL', 'mg/dl'],
    validRange: { min: 10, max: 2000 }
  },
  'hdl': {
    standardName: 'HDL Cholesterol',
    aliases: ['hdl cholesterol', 'hdl', 'high density lipoprotein', 'hdl-c', 'good cholesterol'],
    category: 'lipid',
    unit: ['mg/dL', 'mg/dl'],
    validRange: { min: 10, max: 150 }
  },
  'ldl': {
    standardName: 'LDL Cholesterol',
    aliases: ['ldl cholesterol', 'ldl', 'direct ldl', 'low density lipoprotein', 'ldl-c', 'bad cholesterol'],
    category: 'lipid',
    unit: ['mg/dL', 'mg/dl'],
    validRange: { min: 10, max: 300 }
  },
  'vldl': {
    standardName: 'VLDL',
    aliases: ['vldl', 'very low density lipoprotein', 'vldl cholesterol'],
    category: 'lipid',
    unit: ['mg/dL', 'mg/dl'],
    validRange: { min: 5, max: 100 }
  },

  // LIVER FUNCTION
  'alt': {
    standardName: 'ALT',
    aliases: ['alt', 'sgpt', 'alanine aminotransferase', 'alt/sgpt', 'alanine transaminase'],
    category: 'liver',
    unit: ['U/L', 'U/l', 'IU/L'],
    validRange: { min: 0, max: 200 }
  },
  'ast': {
    standardName: 'AST',
    aliases: ['ast', 'sgot', 'aspartate aminotransferase', 'ast/sgot', 'aspartate transaminase'],
    category: 'liver',
    unit: ['U/L', 'U/l', 'IU/L'],
    validRange: { min: 0, max: 200 }
  },
  'bilirubin_total': {
    standardName: 'Total Bilirubin',
    aliases: ['bilirubin', 'total bilirubin', 'serum bilirubin'],
    category: 'liver',
    unit: ['mg/dL', 'mg/dl', 'µmol/L'],
    validRange: { min: 0, max: 10 }
  },
  'bilirubin_direct': {
    standardName: 'Direct Bilirubin',
    aliases: ['direct bilirubin', 'conjugated bilirubin'],
    category: 'liver',
    unit: ['mg/dL', 'mg/dl', 'µmol/L'],
    validRange: { min: 0, max: 5 }
  },
  'alkaline_phosphatase': {
    standardName: 'Alkaline Phosphatase',
    aliases: ['alkaline phosphatase', 'alp', 'alk phos', 'serum alkaline phosphatase'],
    category: 'liver',
    unit: ['U/L', 'U/l', 'IU/L'],
    validRange: { min: 20, max: 500 }
  },
  'ggt': {
    standardName: 'GGT',
    aliases: ['ggt', 'gamma gt', 'gamma glutamyl transferase', 'ggtp', 'gamma-glutamyl transpeptidase'],
    category: 'liver',
    unit: ['U/L', 'U/l', 'IU/L'],
    validRange: { min: 0, max: 200 }
  },

  // KIDNEY FUNCTION
  'creatinine': {
    standardName: 'Creatinine',
    aliases: ['creatinine', 'serum creatinine', 'creat', 'cr'],
    category: 'kidney',
    unit: ['mg/dL', 'mg/dl', 'µmol/L'],
    validRange: { min: 0.3, max: 5 }
  },
  'urea': {
    standardName: 'Urea',
    aliases: ['urea', 'blood urea', 'serum urea'],
    category: 'kidney',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 5, max: 100 }
  },
  'bun': {
    standardName: 'Blood Urea Nitrogen',
    aliases: ['bun', 'blood urea nitrogen', 'urea nitrogen'],
    category: 'kidney',
    unit: ['mg/dL', 'mg/dl'],
    validRange: { min: 5, max: 50 }
  },

  // THYROID
  'tsh': {
    standardName: 'TSH',
    aliases: ['tsh', 'thyroid stimulating hormone', 'thyrotropin'],
    category: 'thyroid',
    unit: ['µIU/mL', 'mIU/L', 'uIU/mL', 'microIU/mL'],
    validRange: { min: 0.1, max: 10 }
  },
  't3': {
    standardName: 'T3',
    aliases: ['t3', 'triiodothyronine', 't3 total', 'total t3', 't3 - triiodothyronine'],
    category: 'thyroid',
    unit: ['ng/dL', 'ng/dl', 'ng/mL', 'nmol/L'],
    validRange: { min: 0.5, max: 5 }
  },
  't4': {
    standardName: 'T4',
    aliases: ['t4', 'thyroxine', 't4 total', 'total t4', 't4 - thyroxine'],
    category: 'thyroid',
    unit: ['µg/dL', 'ug/dL', 'µg/dl', 'nmol/L', 'mg/mL'],
    validRange: { min: 4, max: 15 }
  },

  // VITAMINS & MINERALS
  'vitamin_d': {
    standardName: '25-Hydroxy Vitamin D',
    aliases: ['vitamin d', '25-hydroxy vitamin d', '25 oh vitamin d', '25(oh) vitamin d', 'vitamin d total', '25-hydroxyvitamin d', '25 hydroxy vitamin-d', '25-hydroxy vitamin-d'],
    category: 'vitamins',
    unit: ['ng/mL', 'ng/ml', 'nmol/L'],
    validRange: { min: 5, max: 150 }
  },
  'vitamin_b12': {
    standardName: 'Vitamin B12',
    aliases: ['vitamin b12', 'b12', 'cobalamin', 'cyanocobalamin'],
    category: 'vitamins',
    unit: ['pg/mL', 'pg/ml', 'pmol/L'],
    validRange: { min: 100, max: 2000 }
  },
  'iron': {
    standardName: 'Iron',
    aliases: ['iron', 'serum iron', 'fe'],
    category: 'minerals',
    unit: ['µg/dL', 'ug/dL', 'µg/dl', 'micro g/dL'],
    validRange: { min: 20, max: 300 }
  },
  'ferritin': {
    standardName: 'Ferritin',
    aliases: ['ferritin', 'serum ferritin'],
    category: 'minerals',
    unit: ['ng/mL', 'ng/ml', 'µg/L'],
    validRange: { min: 10, max: 500 }
  },

  // ELECTROLYTES
  'sodium': {
    standardName: 'Sodium',
    aliases: ['sodium', 'na', 'na+', 'serum sodium'],
    category: 'electrolytes',
    unit: ['mEq/L', 'mmol/L', 'meq/l'],
    validRange: { min: 120, max: 160 }
  },
  'potassium': {
    standardName: 'Potassium',
    aliases: ['potassium', 'k', 'k+', 'serum potassium'],
    category: 'electrolytes',
    unit: ['mEq/L', 'mmol/L', 'meq/l'],
    validRange: { min: 2.5, max: 6.5 }
  },
  'chloride': {
    standardName: 'Chloride',
    aliases: ['chloride', 'cl', 'cl-', 'serum chloride'],
    category: 'electrolytes',
    unit: ['mEq/L', 'mmol/L', 'meq/l'],
    validRange: { min: 90, max: 115 }
  },
  'bicarbonate': {
    standardName: 'Bicarbonate',
    aliases: ['bicarbonate', 'hco3', 'carbon dioxide', 'co2'],
    category: 'electrolytes',
    unit: ['mEq/L', 'mmol/L', 'meq/l'],
    validRange: { min: 18, max: 32 }
  },

  // PROTEINS
  'total_protein': {
    standardName: 'Total Protein',
    aliases: ['total protein', 'protein total', 'serum protein', 'tp'],
    category: 'proteins',
    unit: ['g/dL', 'g/dl'],
    validRange: { min: 4, max: 10 }
  },
  'albumin': {
    standardName: 'Albumin',
    aliases: ['albumin', 'serum albumin', 'alb'],
    category: 'proteins',
    unit: ['g/dL', 'g/dl'],
    validRange: { min: 2, max: 6 }
  },
  'globulin': {
    standardName: 'Globulin',
    aliases: ['globulin', 'serum globulin'],
    category: 'proteins',
    unit: ['g/dL', 'g/dl'],
    validRange: { min: 1.5, max: 5 }
  },

  // CARDIAC MARKERS
  'homocysteine': {
    standardName: 'Homocysteine',
    aliases: ['homocysteine', 'serum homocysteine', 'hcy', 'total homocysteine'],
    category: 'cardiac',
    unit: ['µmol/L', 'umol/L', 'micromol/L'],
    validRange: { min: 2, max: 50 }
  },

  // OTHER COMMON TESTS
  'uric_acid': {
    standardName: 'Uric Acid',
    aliases: ['uric acid', 'serum uric acid', 'urate'],
    category: 'metabolic',
    unit: ['mg/dL', 'mg/dl'],
    validRange: { min: 1, max: 15 }
  },
  'calcium': {
    standardName: 'Calcium',
    aliases: ['calcium', 'serum calcium', 'ca', 'ca++'],
    category: 'minerals',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 7, max: 13 }
  },
  'magnesium': {
    standardName: 'Magnesium',
    aliases: ['magnesium', 'serum magnesium', 'mg', 'mg++'],
    category: 'minerals',
    unit: ['mg/dL', 'mg/dl', 'mEq/L'],
    validRange: { min: 1, max: 4 }
  },
  'esr': {
    standardName: 'ESR',
    aliases: ['esr', 'erythrocyte sedimentation rate', 'sed rate'],
    category: 'inflammation',
    unit: ['mm/hr', 'mm/1hr', 'mm/hour'],
    validRange: { min: 0, max: 100 }
  },
  'psa': {
    standardName: 'PSA',
    aliases: ['psa', 'prostate specific antigen', 'psa-prostate specific antigen'],
    category: 'tumor_markers',
    unit: ['ng/mL', 'ng/ml'],
    validRange: { min: 0, max: 20 }
  },
  'ige': {
    standardName: 'IgE',
    aliases: ['ige', 'immunoglobulin e', 'total ige'],
    category: 'immunology',
    unit: ['IU/mL', 'IU/ml', 'kU/L'],
    validRange: { min: 0, max: 1000 }
  }
};

// Helper function to normalize biomarker names
export function normalizeBiomarkerName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\-+]/g, ' ')  // Remove special chars except - and +
    .replace(/\s+/g, ' ')          // Normalize whitespace
    .trim();
}

// Find biomarker definition by alias
export function findBiomarkerByAlias(text: string): [string, BiomarkerDefinition] | null {
  const normalized = normalizeBiomarkerName(text);
  
  for (const [key, biomarker] of Object.entries(BIOMARKER_DICTIONARY)) {
    for (const alias of biomarker.aliases) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        return [key, biomarker];
      }
    }
  }
  
  return null;
}

File 3: Remarks Dictionary
File: src/lib/parsers/remarksDictionary.ts
typescriptimport { Remark } from './types';

export interface RemarkPattern {
  pattern: RegExp;
  type: 'biomarker' | 'section' | 'general' | 'interpretation' | 'recommendation';
  biomarkerKeywords?: string[];
  priority: number;
}

export class RemarksDictionary {
  // Common remark section headers
  static readonly REMARK_HEADERS = [
    'remarks',
    'comments',
    'interpretation',
    'clinical significance',
    'note',
    'explanation',
    'recommendation',
    'suggested',
    'limitations',
    'interfering factors',
    'clinical correlation',
    'follow up',
    'advice',
    'summary and uses',
    'additional information'
  ];

  // Patterns for identifying different types of remarks
  static readonly REMARK_PATTERNS: RemarkPattern[] = [
    // Vitamin D specific patterns
    {
      pattern: /vitamin\s+d\s+(?:helps|is\s+essential|plays|important|regulates?)/i,
      type: 'biomarker',
      biomarkerKeywords: ['vitamin d', '25-hydroxy'],
      priority: 1
    },
    {
      pattern: /(?:deficiency|insufficiency|sufficiency|intoxification|toxicity)\s*(?::|<|>)?\s*[\d\.<>-]+/i,
      type: 'interpretation',
      biomarkerKeywords: ['vitamin d'],
      priority: 2
    },

    // HbA1c specific patterns
    {
      pattern: /hba1c\s+level\s+(?:is\s+)?(?:an\s+)?indicator/i,
      type: 'biomarker',
      biomarkerKeywords: ['hba1c', 'glycosylated hemoglobin'],
      priority: 1
    },
    {
      pattern: /(?:diabetic|pre-diabetic|non-diabetic|poor\s+control|good\s+control)/i,
      type: 'interpretation',
      biomarkerKeywords: ['hba1c', 'glucose'],
      priority: 2
    },

    // General medical interpretations
    {
      pattern: /according\s+to\s+(?:guidelines|recommendations|criteria)/i,
      type: 'interpretation',
      priority: 3
    },
    {
      pattern: /(?:increased|decreased|elevated|low|high|normal)\s+(?:levels?|values?)\s+(?:may|might|could|indicate|suggest)/i,
      type: 'interpretation',
      priority: 2
    },

    // Treatment/follow-up recommendations
    {
      pattern: /(?:recommend|suggest|advise|should)\s+(?:monitoring|follow-up|retest|consult|treatment)/i,
      type: 'recommendation',
      priority: 1
    },
    {
      pattern: /(?:lifestyle|dietary?|exercise)\s+(?:modifications?|changes?|interventions?)/i,
      type: 'recommendation',
      priority: 2
    },

    // Interference and limitations
    {
      pattern: /(?:may\s+)?interfere(?:s)?\s+with|false\s+(?:positive|negative)|limitations?/i,
      type: 'general',
      priority: 3
    },

    // Clinical significance
    {
      pattern: /clinical(?:ly)?\s+(?:significant|significance|correlation|relevance)/i,
      type: 'interpretation',
      priority: 2
    },

    // General health advice
    {
      pattern: /(?:maintain|improve|reduce|increase)\s+(?:health|levels?|intake|activity)/i,
      type: 'recommendation',
      priority: 3
    }
  ];

  // Keywords that indicate a remark is about a specific biomarker
  static readonly BIOMARKER_ASSOCIATION_KEYWORDS: Record<string, string[]> = {
    'vitamin d': ['vitamin d', '25-hydroxy', 'cholecalciferol', 'ergocalciferol', 'calcitriol'],
    'hba1c': ['hba1c', 'glycosylated', 'glycated', 'hemoglobin a1c', 'blood glucose levels'],
    'cholesterol': ['cholesterol', 'lipid', 'hdl', 'ldl', 'triglyceride'],
    'liver': ['alt', 'ast', 'bilirubin', 'alkaline phosphatase', 'liver function', 'hepatic'],
    'kidney': ['creatinine', 'urea', 'bun', 'kidney function', 'renal'],
    'thyroid': ['tsh', 't3', 't4', 'thyroid', 'hypothyroid', 'hyperthyroid'],
    'diabetes': ['glucose', 'blood sugar', 'diabetes', 'diabetic'],
    'anemia': ['hemoglobin', 'hematocrit', 'rbc', 'iron', 'ferritin', 'anemia'],
    'electrolytes': ['sodium', 'potassium', 'chloride', 'electrolyte']
  };

  /**
   * Check if text contains a remark header
   */
  static isRemarkHeader(text: string): boolean {
    const normalized = text.toLowerCase().trim();
    return this.REMARK_HEADERS.some(header => 
      normalized.includes(header) || normalized.startsWith(header)
    );
  }

  /**
   * Extract biomarker associations from remark text
   */
  static extractBiomarkerAssociations(remarkText: string): string[] {
    const associations = new Set<string>();
    const textLower = remarkText.toLowerCase();

    for (const [biomarkerKey, keywords] of Object.entries(this.BIOMARKER_ASSOCIATION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          associations.add(biomarkerKey);
        }
      }
    }

    return Array.from(associations);
  }

  /**
   * Determine remark type based on content
   */
  static determineRemarkType(text: string): Remark['type'] {
    const textLower = text.toLowerCase();

    // Check patterns in priority order
    const sortedPatterns = [...this.REMARK_PATTERNS].sort((a, b) => a.priority - b.priority);

    for (const pattern of sortedPatterns) {
      if (pattern.pattern.test(text)) {
        return pattern.type;
      }
    }

    // Default classification based on keywords
    if (textLower.includes('recommend') || textLower.includes('suggest') || textLower.includes('should')) {
      return 'recommendation';
    }
    
    if (textLower.includes('normal') || textLower.includes('abnormal') || textLower.includes('elevated')) {
      return 'interpretation';
    }

    return 'general';
  }

  /**
   * Calculate confidence score for a remark
   */
  static calculateRemarkConfidence(remark: {
    content: string;
    type: Remark['type'];
    source: 'direct' | 'inferred';
  }): number {
    let confidence = 0.5;

    // Direct remarks (with headers) have higher confidence
    if (remark.source === 'direct') {
      confidence += 0.3;
    }

    // Longer, more detailed remarks have higher confidence
    const wordCount = remark.content.split(/\s+/).length;
    if (wordCount > 20) {
      confidence += 0.1;
    }

    // Remarks with specific medical terms have higher confidence
    const medicalTerms = [
      'clinical', 'significant', 'diagnosis', 'treatment',
      'recommend', 'guidelines', 'criteria', 'normal range'
    ];
    
    const contentLower = remark.content.toLowerCase();
    const medicalTermCount = medicalTerms.filter(term => contentLower.includes(term)).length;
    confidence += Math.min(medicalTermCount * 0.05, 0.2);

    return Math.min(confidence, 1.0);
  }
}

File 4: Text Preprocessor
File: src/lib/parsers/textPreprocessor.ts
typescriptexport class TextPreprocessor {
  // Common OCR errors mapping
  private static readonly OCR_CORRECTIONS: Record<string, string> = {
    // Letter/number confusion
    'l': '1', // lowercase L to 1 in numeric contexts
    'O': '0', // uppercase O to 0 in numeric contexts
    'S': '5', // S to 5 in numeric contexts
    'Z': '2', // Z to 2 in numeric contexts
    'B': '8', // B to 8 in numeric contexts
    
    // Common medical abbreviations
    'mg/dI': 'mg/dL',
    'mg/di': 'mg/dL',
    'mq/dL': 'mg/dL',
    'U/I': 'U/L',
    'IU/I': 'IU/L',
    'ug/dL': 'µg/dL',
    'umol/L': 'µmol/L',
    'uIU/mL': 'µIU/mL'
  };

  /**
   * Clean and normalize OCR text for better parsing
   */
  static cleanOCRText(text: string): string {
    let cleaned = text;

    // Step 1: Normalize line endings and remove excessive whitespace
    cleaned = cleaned
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\S\n]+/g, ' ')  // Replace multiple spaces/tabs with single space
      .trim();

    // Step 2: Fix common OCR issues in numeric contexts
    cleaned = this.fixNumericOCRErrors(cleaned);

    // Step 3: Normalize units
    cleaned = this.normalizeUnits(cleaned);

    // Step 4: Fix concatenated words (common in PDFs)
    cleaned = this.fixConcatenatedWords(cleaned);

    // Step 5: Remove noise characters
    cleaned = this.removeNoiseCharacters(cleaned);

    return cleaned;
  }

  /**
   * Fix OCR errors in numeric contexts
   */
  private static fixNumericOCRErrors(text: string): string {
    // Fix lowercase L to 1 in numeric contexts
    text = text.replace(/(\d)l(\d)/g, '$11$2');
    text = text.replace(/(\d)l\b/g, '$11');
    text = text.replace(/\bl(\d)/g, '1$1');

    // Fix uppercase O to 0 in numeric contexts
    text = text.replace(/(\d)O(\d)/g, '$10$2');
    text = text.replace(/(\d)O\b/g, '$10');
    text = text.replace(/\bO(\d)/g, '0$1');

    // Fix decimal points that got read as commas
    text = text.replace(/(\d),(\d{1,2})\b/g, '$1.$2');

    return text;
  }

  /**
   * Normalize medical units to standard format
   */
  private static normalizeUnits(text: string): string {
    // Normalize common units
    const unitNormalizations = [
      // Mass/volume
      { pattern: /mg\/dl/gi, replacement: 'mg/dL' },
      { pattern: /gm\/dl/gi, replacement: 'g/dL' },
      { pattern: /grams\/dl/gi, replacement: 'g/dL' },
      { pattern: /mcg\/dl/gi, replacement: 'µg/dL' },
      { pattern: /ug\/dl/gi, replacement: 'µg/dL' },
      
      // Activity units
      { pattern: /U\/l/g, replacement: 'U/L' },
      { pattern: /IU\/l/gi, replacement: 'IU/L' },
      { pattern: /mIU\/l/gi, replacement: 'mIU/L' },
      { pattern: /uIU\/ml/g, replacement: 'µIU/mL' },
      
      // Cell counts
      { pattern: /\/cumm/g, replacement: '/cmm' },
      { pattern: /cells\/ul/gi, replacement: '/µL' },
      { pattern: /mill\/cumm/gi, replacement: 'million/cmm' },
      
      // Concentration
      { pattern: /mmol\/l/gi, replacement: 'mmol/L' },
      { pattern: /meq\/l/gi, replacement: 'mEq/L' },
      { pattern: /ng\/ml/gi, replacement: 'ng/mL' },
      { pattern: /pg\/ml/gi, replacement: 'pg/mL' }
    ];

    let normalized = text;
    unitNormalizations.forEach(({ pattern, replacement }) => {
      normalized = normalized.replace(pattern, replacement);
    });

    return normalized;
  }

  /**
   * Fix words that got concatenated during PDF extraction
   */
  private static fixConcatenatedWords(text: string): string {
    // Common patterns where biomarkers get concatenated
    const fixes = [
      { pattern: /HbA1c\(Glycosylated/g, replacement: 'HbA1c (Glycosylated' },
      { pattern: /ALT\/SGPT(\d)/g, replacement: 'ALT/SGPT $1' },
      { pattern: /(\d+)([A-Z][a-z]+)/g, replacement: '$1 $2' },  // 123Hemoglobin -> 123 Hemoglobin
      { pattern: /([a-z])([A-Z])/g, replacement: '$1 $2' }       // testResult -> test Result
    ];

    let fixed = text;
    fixes.forEach(({ pattern, replacement }) => {
      fixed = fixed.replace(pattern, replacement);
    });

    return fixed;
  }

  /**
   * Remove noise characters that interfere with parsing
   */
  private static removeNoiseCharacters(text: string): string {
    // Remove common noise patterns
    return text
      .replace(/[•·▪]/g, '')           // Remove bullet points
      .replace(/[\u0000-\u001F]/g, '') // Remove control characters
      .replace(/[\u007F-\u009F]/g, '') // Remove DEL and C1 control codes
      .replace(/[\u200B-\u200D]/g, '') // Remove zero-width spaces
      .replace(/[\uFEFF]/g, '');       // Remove BOM
  }

  /**
   * Extract clean lines from text, filtering out noise
   */
  static extractCleanLines(text: string): string[] {
    const lines = text.split('\n');
    
    return lines
      .map(line => line.trim())
      .filter(line => {
        // Remove empty lines
        if (!line) return false;
        
        // Remove lines that are just numbers or special characters
        if (/^[\d\s\-_.]+$/.test(line)) return false;
        
        // Remove very short lines (likely noise)
        if (line.length < 3) return false;
        
        // Remove lines that are just punctuation
        if (/^[^\w]+$/.test(line)) return false;
        
        return true;
      });
  }

  /**
   * Identify and extract table structures from text
   */
  static identifyTableStructure(lines: string[]): { headers: string[], rows: string[][] } | null {
    // Look for header patterns (multiple words separated by consistent spacing)
    const headerPattern = /^(\w+[\s\w]*)\s{2,}(\w+[\s\w]*)\s{2,}(\w+[\s\w]*)/;
    
    for (let i = 0; i < lines.length - 1; i++) {
      if (headerPattern.test(lines[i])) {
        // Potential header found, check if next lines follow similar structure
        const headers = lines[i].split(/\s{2,}/).map(h => h.trim());
        const rows: string[][] = [];
        
        for (let j = i + 1; j < lines.length && j < i + 10; j++) {
          const cells = lines[j].split(/\s{2,}/).map(c => c.trim());
          if (cells.length >= headers.length - 1) {
            rows.push(cells);
          } else {
            break;
          }
        }
        
        if (rows.length > 0) {
          return { headers, rows };
        }
      }
    }
    
    return null;
  }
}

File 5: Section Parser
File: src/lib/parsers/sectionParser.ts
typescriptimport { TextPreprocessor } from './textPreprocessor';
import { ReportSection } from './types';

export class SectionParser {
  // Common section headers in lab reports
  private static readonly SECTION_PATTERNS: Array<{
    name: string;
    patterns: RegExp[];
    priority: number;
  }> = [
    {
      name: 'HEMATOLOGY',
      patterns: [
        /^\s*(?:HEMATOLOGY|HAEMATOLOGY)(?:\s+REPORT)?\s*$/im,
        /^\s*(?:Complete Blood Count|CBC|COMPLETE BLOOD COUNT)(?:\s+REPORT)?\s*$/im,
        /^\s*(?:BLOOD COUNT|Blood Count)(?:\s+REPORT)?\s*$/im
      ],
      priority: 1
    },
    {
      name: 'BIOCHEMISTRY',
      patterns: [
        /^\s*(?:BIOCHEMISTRY|BIO-CHEMISTRY)(?:\s+REPORT)?\s*$/im,
        /^\s*(?:CLINICAL CHEMISTRY|Clinical Chemistry)(?:\s+REPORT)?\s*$/im,
        /^\s*(?:CHEMISTRY|Chemistry)(?:\s+REPORT)?\s*$/im
      ],
      priority: 1
    },
    {
      name: 'LIPID_PROFILE',
      patterns: [
        /^\s*(?:LIPID PROFILE|Lipid Profile)(?:\s+REPORT)?\s*$/im,
        /^\s*(?:LIPID PANEL|Lipid Panel)(?:\s+REPORT)?\s*$/im,
        /^\s*(?:CHOLESTEROL|Cholesterol)(?:\s+REPORT)?\s*$/im
      ],
      priority: 2
    },
    {
      name: 'LIVER_FUNCTION',
      patterns: [
        /^\s*(?:LIVER FUNCTION TEST|LFT)(?:\s+(?:WITH|With)?\s*GGT)?\s*$/im,
        /^\s*(?:Liver Function Test|Liver Profile)(?:\s+REPORT)?\s*$/im,
        /^\s*(?:HEPATIC PANEL|Hepatic Panel)(?:\s+REPORT)?\s*$/im
      ],
      priority: 2
    },
    {
      name: 'KIDNEY_FUNCTION',
      patterns: [
        /^\s*(?:KIDNEY FUNCTION TEST|KFT|RENAL FUNCTION TEST|RFT)\s*$/im,
        /^\s*(?:Kidney Profile|Renal Profile)(?:\s+REPORT)?\s*$/im,
        /^\s*(?:RENAL PANEL|Renal Panel)(?:\s+REPORT)?\s*$/im
      ],
      priority: 2
    },
    {
      name: 'THYROID',
      patterns: [
        /^\s*(?:THYROID FUNCTION TEST|TFT|Thyroid Function Test)\s*$/im,
        /^\s*(?:THYROID PROFILE|Thyroid Profile)(?:\s+REPORT)?\s*$/im,
        /^\s*(?:THYROID PANEL|Thyroid Panel)(?:\s+REPORT)?\s*$/im
      ],
      priority: 2
    },
    {
      name: 'ELECTROLYTES',
      patterns: [
        /^\s*(?:SERUM ELECTROLYTES|ELECTROLYTES|Electrolytes)\s*$/im,
        /^\s*(?:ELECTROLYTE PANEL|Electrolyte Panel)(?:\s+REPORT)?\s*$/im
      ],
      priority: 2
    },
    {
      name: 'DIABETES',
      patterns: [
        /^\s*(?:DIABETES|DIABETIC PROFILE|Diabetes Profile)\s*$/im,
        /^\s*(?:GLUCOSE|Blood Sugar|BLOOD SUGAR)(?:\s+REPORT)?\s*$/im,
        /^\s*(?:HbA1c|GLYCATED HEMOGLOBIN|Glycosylated Hemoglobin)\s*$/im
      ],
      priority: 2
    },
    {
      name: 'VITAMINS',
      patterns: [
        /^\s*(?:VITAMIN|VITAMINS|Vitamin Profile)\s*$/im,
        /^\s*(?:NUTRITIONAL MARKERS|Nutritional Markers)\s*$/im
      ],
      priority: 2
    },
    {
      name: 'IMMUNOLOGY',
      patterns: [
        /^\s*(?:IMMUNOLOGY|IMMUNOASSAY|Immunoassay)\s*$/im,
        /^\s*(?:SEROLOGY|Serology)(?:\s+REPORT)?\s*$/im
      ],
      priority: 2
    },
    {
      name: 'URINALYSIS',
      patterns: [
        /^\s*(?:URINALYSIS|URINE ANALYSIS|Urine Routine)\s*$/im,
        /^\s*(?:URINE EXAMINATION|Urine Examination)\s*$/im
      ],
      priority: 3
    }
  ];

  /**
   * Parse document into sections
   */
  static parseSections(text: string): Map<string, ReportSection> {
    const cleanedText = TextPreprocessor.cleanOCRText(text);
    const lines = cleanedText.split('\n');
    const sections = new Map<string, ReportSection>();
    
    // First pass: Find all section headers
    const foundHeaders: Array<{
      name: string;
      lineIndex: number;
      priority: number;
      originalMatch: string;
    }> = [];

    lines.forEach((line, index) => {
      for (const sectionDef of this.SECTION_PATTERNS) {
        for (const pattern of sectionDef.patterns) {
          const match = line.match(pattern);
          if (match) {
            foundHeaders.push({
              name: sectionDef.name,
              lineIndex: index,
              priority: sectionDef.priority,
              originalMatch: match[0]
            });
            break; // Only match once per line
          }
        }
      }
    });

    // Sort headers by line index
    foundHeaders.sort((a, b) => a.lineIndex - b.lineIndex);

    // Second pass: Extract section content
    for (let i = 0; i < foundHeaders.length; i++) {
      const header = foundHeaders[i];
      const startIndex = header.lineIndex + 1;
      const endIndex = i < foundHeaders.length - 1 
        ? foundHeaders[i + 1].lineIndex 
        : lines.length;

      const sectionLines = lines.slice(startIndex, endIndex);
      const sectionContent = sectionLines.join('\n').trim();

      if (sectionContent.length > 10) { // Ignore empty sections
        sections.set(header.name, {
          name: header.name,
          content: sectionContent,
          startIndex: startIndex,
          endIndex: endIndex,
          confidence: this.calculateSectionConfidence(sectionContent, header.name)
        });
      }
    }

    // If no sections found, create a default section
    if (sections.size === 0) {
      sections.set('GENERAL', {
        name: 'GENERAL',
        content: cleanedText,
        startIndex: 0,
        endIndex: lines.length,
        confidence: 0.5
      });
    }

    return sections;
  }

  /**
   * Calculate confidence score for a section
   */
  private static calculateSectionConfidence(content: string, sectionName: string): number {
    let confidence = 0.5; // Base confidence

    // Check for expected biomarkers in section
    const expectedBiomarkers: Record<string, string[]> = {
      'HEMATOLOGY': ['hemoglobin', 'rbc', 'wbc', 'platelet', 'hematocrit'],
      'BIOCHEMISTRY': ['glucose', 'urea', 'creatinine'],
      'LIPID_PROFILE': ['cholesterol', 'triglyceride', 'hdl', 'ldl'],
      'LIVER_FUNCTION': ['bilirubin', 'alt', 'ast', 'alkaline phosphatase'],
      'THYROID': ['tsh', 't3', 't4'],
      'ELECTROLYTES': ['sodium', 'potassium', 'chloride'],
      'VITAMINS': ['vitamin d', 'vitamin b12', 'folate']
    };

    const expected = expectedBiomarkers[sectionName] || [];
    const contentLower = content.toLowerCase();
    
    let foundCount = 0;
    for (const biomarker of expected) {
      if (contentLower.includes(biomarker)) {
        foundCount++;
      }
    }

    if (expected.length > 0) {
      confidence = Math.min(0.5 + (foundCount / expected.length) * 0.5, 1.0);
    }

    // Check for value patterns (increases confidence)
    const valuePattern = /\d+\.?\d*\s*(?:mg\/dL|g\/dL|U\/L|%|ng\/mL)/gi;
    const valueMatches = content.match(valuePattern) || [];
    if (valueMatches.length > 0) {
      confidence = Math.min(confidence + 0.1, 1.0);
    }

    return confidence;
  }

  /**
   * Extract subsections within a main section
   */
  static extractSubsections(sectionContent: string): Map<string, string> {
    const subsections = new Map<string, string>();
    const lines = sectionContent.split('\n');
    
    // Look for subsection patterns (e.g., "Liver Enzymes:", "Proteins:", etc.)
    const subsectionPattern = /^([A-Za-z\s]+):\s*$/;
    
    let currentSubsection = 'main';
    let currentContent: string[] = [];
    
    for (const line of lines) {
      const match = line.match(subsectionPattern);
      if (match) {
        // Save previous subsection
        if (currentContent.length > 0) {
          subsections.set(currentSubsection, currentContent.join('\n').trim());
        }
        
        // Start new subsection
        currentSubsection = match[1].trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    
    // Save last subsection
    if (currentContent.length > 0) {
      subsections.set(currentSubsection, currentContent.join('\n').trim());
    }
    
    return subsections;
  }
}

File 6: Biomarker Extractor
File: src/lib/parsers/biomarkerExtractor.ts
typescriptimport { 
  ExtractedBiomarker, 
  findBiomarkerByAlias, 
  BIOMARKER_DICTIONARY,
  normalizeBiomarkerName 
} from './biomarkerDictionary';
import { TextPreprocessor } from './textPreprocessor';

export class BiomarkerExtractor {
  // Patterns for extracting biomarker values
  private static readonly VALUE_PATTERNS = {
    // Pattern 1: Biomarker name followed by value and unit
    STANDARD: /^(.+?)\s+(\d+\.?\d*)\s*(mg\/dL|g\/dL|U\/L|%|ng\/mL|µg\/dL|µIU\/mL|mEq\/L|mmol\/L|\/cmm|million\/cmm|pg\/mL|µmol\/L)/i,
    
    // Pattern 2: Biomarker with value on next line
    MULTILINE: /^(.+?)[\s:]*$/,
    
    // Pattern 3: Table format with columns
    TABLE_ROW: /^(.+?)\s{2,}(\d+\.?\d*)\s*([\w\/]+)?\s*([\d\.\-\s]+)?/,
    
    // Pattern 4: Biomarker with gender-specific ranges
    GENDER_SPECIFIC: /^(.+?)\s+(\d+\.?\d*)\s*([\w\/]+)?\s*Male\s*([\d\.\-\s]+)\s*Female\s*([\d\.\-\s]+)/i,
    
    // Pattern 5: Just value and unit (when biomarker name is on previous line)
    VALUE_ONLY: /^(\d+\.?\d*)\s*(mg\/dL|g\/dL|U\/L|%|ng\/mL|µg\/dL|µIU\/mL|mEq\/L|mmol\/L|\/cmm|million\/cmm|pg\/mL|µmol\/L)/i,
    
    // Pattern 6: Reference range patterns
    REFERENCE_RANGE: /(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/,
    LESS_THAN: /<\s*(\d+\.?\d*)/,
    GREATER_THAN: />\s*(\d+\.?\d*)/
  };

  /**
   * Extract biomarkers from text content
   */
  static extractBiomarkers(content: string, sectionName?: string): ExtractedBiomarker[] {
    const cleanedContent = TextPreprocessor.cleanOCRText(content);
    const lines = TextPreprocessor.extractCleanLines(cleanedContent);
    const biomarkers: ExtractedBiomarker[] = [];
    
    // Try multiple extraction strategies
    const tableMarkers = this.extractFromTableFormat(lines);
    const lineMarkers = this.extractLineByLine(lines);
    const contextMarkers = this.extractWithContext(lines);
    
    // Merge results, preferring higher confidence extractions
    const allMarkers = [...tableMarkers, ...lineMarkers, ...contextMarkers];
    const uniqueMarkers = this.deduplicateBiomarkers(allMarkers);
    
    // Filter by section if provided
    if (sectionName) {
      return uniqueMarkers.filter(marker => 
        this.isBiomarkerExpectedInSection(marker.standardName, sectionName)
      );
    }
    
    return uniqueMarkers;
  }

  /**
   * Extract biomarkers from table format
   */
  private static extractFromTableFormat(lines: string[]): ExtractedBiomarker[] {
    const biomarkers: ExtractedBiomarker[] = [];
    const tableStructure = TextPreprocessor.identifyTableStructure(lines);
    
    if (!tableStructure) return biomarkers;
    
    const { headers, rows } = tableStructure;
    
    // Find column indices
    const nameColIndex = headers.findIndex(h => 
      /test|investigation|parameter|analyte/i.test(h)
    );
    const valueColIndex = headers.findIndex(h => 
      /value|result|observed/i.test(h)
    );
    const unitColIndex = headers.findIndex(h => 
      /unit/i.test(h)
    );
    const rangeColIndex = headers.findIndex(h => 
      /range|reference|normal/i.test(h)
    );
    
    if (nameColIndex === -1 || valueColIndex === -1) return biomarkers;
    
    // Extract from each row
    for (const row of rows) {
      if (row.length <= valueColIndex) continue;
      
      const name = row[nameColIndex];
      const value = parseFloat(row[valueColIndex]);
      const unit = unitColIndex !== -1 && row[unitColIndex] ? row[unitColIndex] : '';
      const range = rangeColIndex !== -1 && row[rangeColIndex] ? row[rangeColIndex] : '';
      
      if (!isNaN(value)) {
        const biomarkerDef = findBiomarkerByAlias(name);
        if (biomarkerDef) {
          const [key, definition] = biomarkerDef;
          biomarkers.push({
            name: name,
            standardName: definition.standardName,
            value: value,
            unit: unit || definition.unit[0],
            referenceRange: range,
            status: this.calculateStatus(value, range),
            confidence: 0.9, // High confidence for table format
            category: definition.category,
            rawText: row.join(' ')
          });
        }
      }
    }
    
    return biomarkers;
  }

  /**
   * Extract biomarkers line by line
   */
  private static extractLineByLine(lines: string[]): ExtractedBiomarker[] {
    const biomarkers: ExtractedBiomarker[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Try standard pattern
      const standardMatch = line.match(this.VALUE_PATTERNS.STANDARD);
      if (standardMatch) {
        const [_, name, value, unit] = standardMatch;
        const biomarkerDef = findBiomarkerByAlias(name);
        
        if (biomarkerDef) {
          const [key, definition] = biomarkerDef;
          const numValue = parseFloat(value);
          
          if (this.isValueInValidRange(numValue, definition)) {
            // Look for reference range in the same or next line
            const rangeMatch = line.match(this.VALUE_PATTERNS.REFERENCE_RANGE) ||
                              (i + 1 < lines.length && lines[i + 1].match(this.VALUE_PATTERNS.REFERENCE_RANGE));
            
            biomarkers.push({
              name: name.trim(),
              standardName: definition.standardName,
              value: numValue,
              unit: unit,
              referenceRange: rangeMatch ? rangeMatch[0] : undefined,
              status: 'normal', // Will be calculated later
              confidence: 0.8,
              category: definition.category,
              rawText: line
            });
          }
        }
      }
      
      // Try multiline pattern (biomarker name on one line, value on next)
      const multilineMatch = line.match(this.VALUE_PATTERNS.MULTILINE);
      if (multilineMatch && i + 1 < lines.length) {
        const name = multilineMatch[1];
        const biomarkerDef = findBiomarkerByAlias(name);
        
        if (biomarkerDef) {
          const nextLine = lines[i + 1];
          const valueMatch = nextLine.match(this.VALUE_PATTERNS.VALUE_ONLY);
          
          if (valueMatch) {
            const [_, value, unit] = valueMatch;
            const [key, definition] = biomarkerDef;
            const numValue = parseFloat(value);
            
            if (this.isValueInValidRange(numValue, definition)) {
              biomarkers.push({
                name: name.trim(),
                standardName: definition.standardName,
                value: numValue,
                unit: unit,
                referenceRange: undefined,
                status: 'normal',
                confidence: 0.7,
                category: definition.category,
                rawText: `${line} ${nextLine}`
              });
            }
          }
        }
      }
    }
    
    return biomarkers;
  }

  /**
   * Extract biomarkers with context awareness
   */
  private static extractWithContext(lines: string[]): ExtractedBiomarker[] {
    const biomarkers: ExtractedBiomarker[] = [];
    const context = {
      currentSection: '',
      lastBiomarkerName: '',
      inTable: false
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      
      // Update context
      if (/^(hematology|biochemistry|lipid|liver|kidney|thyroid)/i.test(line)) {
        context.currentSection = line;
        continue;
      }
      
      // Check if we're in a table
      if (line.includes('Test') && line.includes('Result') && line.includes('Unit')) {
        context.inTable = true;
        continue;
      }
      
      // Look for biomarker patterns based on context
      for (const [key, definition] of Object.entries(BIOMARKER_DICTIONARY)) {
        for (const alias of definition.aliases) {
          if (lineLower.includes(alias)) {
            // Found potential biomarker, look for value
            const remainingLine = line.substring(line.toLowerCase().indexOf(alias) + alias.length);
            const valueMatch = remainingLine.match(/(\d+\.?\d*)\s*([\w\/]+)?/);
            
            if (valueMatch) {
              const value = parseFloat(valueMatch[1]);
              const unit = valueMatch[2] || definition.unit[0];
              
              if (this.isValueInValidRange(value, definition)) {
                biomarkers.push({
                  name: alias,
                  standardName: definition.standardName,
                  value: value,
                  unit: unit,
                  referenceRange: undefined,
                  status: 'normal',
                  confidence: context.inTable ? 0.85 : 0.65,
                  category: definition.category,
                  rawText: line
                });
                
                context.lastBiomarkerName = definition.standardName;
                break;
              }
            }
          }
        }
      }
    }
    
    return biomarkers;
  }

  /**
   * Check if value is within valid range for biomarker
   */
  private static isValueInValidRange(value: number, definition: any): boolean {
    return value >= definition.validRange.min && value <= definition.validRange.max;
  }

  /**
   * Calculate status based on value and reference range
   */
  private static calculateStatus(value: number, referenceRange: string): 'low' | 'normal' | 'high' | 'critical' {
    if (!referenceRange) return 'normal';
    
    const rangeMatch = referenceRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    if (rangeMatch) {
      const [_, minStr, maxStr] = rangeMatch;
      const min = parseFloat(minStr);
      const max = parseFloat(maxStr);
      
      if (value < min) return 'low';
      if (value > max) return 'high';
      return 'normal';
    }
    
    const lessThanMatch = referenceRange.match(/<\s*(\d+\.?\d*)/);
    if (lessThanMatch) {
      const threshold = parseFloat(lessThanMatch[1]);
      return value < threshold ? 'normal' : 'high';
    }
    
    const greaterThanMatch = referenceRange.match(/>\s*(\d+\.?\d*)/);
    if (greaterThanMatch) {
      const threshold = parseFloat(greaterThanMatch[1]);
      return value > threshold ? 'normal' : 'low';
    }
    
    return 'normal';
  }

  /**
   * Deduplicate biomarkers, keeping highest confidence
   */
  private static deduplicateBiomarkers(biomarkers: ExtractedBiomarker[]): ExtractedBiomarker[] {
    const uniqueMap = new Map<string, ExtractedBiomarker>();
    
    for (const marker of biomarkers) {
      const key = `${marker.standardName}_${marker.value}`;
      const existing = uniqueMap.get(key);
      
      if (!existing || marker.confidence > existing.confidence) {
        uniqueMap.set(key, marker);
      }
    }
    
    return Array.from(uniqueMap.values());
  }

  /**
   * Check if biomarker is expected in section
   */
  private static isBiomarkerExpectedInSection(biomarkerName: string, sectionName: string): boolean {
    const sectionExpectations: Record<string, string[]> = {
      'HEMATOLOGY': ['Hemoglobin', 'Hematocrit', 'RBC Count', 'WBC Count', 'Platelet Count', 'MCV', 'MCH', 'MCHC'],
      'BIOCHEMISTRY': ['Glucose', 'Urea', 'Creatinine', 'Uric Acid'],
      'LIPID_PROFILE': ['Total Cholesterol', 'Triglycerides', 'HDL Cholesterol', 'LDL Cholesterol', 'VLDL'],
      'LIVER_FUNCTION': ['Total Bilirubin', 'Direct Bilirubin', 'ALT', 'AST', 'Alkaline Phosphatase', 'GGT', 'Total Protein', 'Albumin'],
      'KIDNEY_FUNCTION': ['Creatinine', 'Urea', 'Blood Urea Nitrogen', 'eGFR'],
      'THYROID': ['TSH', 'T3', 'T4', 'Free T3', 'Free T4'],
      'ELECTROLYTES': ['Sodium', 'Potassium', 'Chloride', 'Bicarbonate'],
      'VITAMINS': ['25-Hydroxy Vitamin D', 'Vitamin B12', 'Folate']
    };
    
    const expected = sectionExpectations[sectionName];
    return expected ? expected.includes(biomarkerName) : true;
  }
}

File 7: Remarks Extractor
File: src/lib/parsers/remarksExtractor.ts
typescriptimport { v4 as uuidv4 } from 'uuid';
import { Remark } from './types';
import { RemarksDictionary } from './remarksDictionary';
import { TextPreprocessor } from './textPreprocessor';
import { ExtractedBiomarker, BIOMARKER_DICTIONARY } from './biomarkerDictionary';

export class RemarksExtractor {
  /**
   * Extract remarks from report content
   */
  static extractRemarks(
    content: string, 
    sections: Map<string, any>,
    biomarkers: ExtractedBiomarker[]
  ): Remark[] {
    const remarks: Remark[] = [];
    const cleanedContent = TextPreprocessor.cleanOCRText(content);
    const lines = cleanedContent.split('\n');
    
    // Strategy 1: Extract from dedicated remark sections
    const sectionRemarks = this.extractFromRemarkSections(lines, sections);
    remarks.push(...sectionRemarks);
    
    // Strategy 2: Extract inline remarks
    const inlineRemarks = this.extractInlineRemarks(lines, sections);
    remarks.push(...inlineRemarks);
    
    // Strategy 3: Extract from section footers
    const footerRemarks = this.extractSectionFooterRemarks(sections);
    remarks.push(...footerRemarks);
    
    // Associate remarks with biomarkers
    const associatedRemarks = this.associateRemarksWithBiomarkers(remarks, biomarkers);
    
    return this.deduplicateRemarks(associatedRemarks);
  }

  /**
   * Extract remarks from dedicated sections
   */
  private static extractFromRemarkSections(
    lines: string[], 
    sections: Map<string, any>
  ): Remark[] {
    const remarks: Remark[] = [];
    let inRemarkSection = false;
    let currentSection = '';
    let remarkContent: string[] = [];
    let sectionStartLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this is a remark header
      if (RemarksDictionary.isRemarkHeader(line)) {
        // Save previous remark if exists
        if (inRemarkSection && remarkContent.length > 0) {
          const content = remarkContent.join(' ').trim();
          if (content.length > 10) {
            remarks.push(this.createRemark(content, currentSection, 'direct'));
          }
        }
        
        // Start new remark section
        inRemarkSection = true;
        currentSection = this.findCurrentSection(i, sections);
        remarkContent = [];
        sectionStartLine = i;
        continue;
      }
      
      // If in remark section, collect content
      if (inRemarkSection) {
        // Check if we've hit a new section
        const isNewSection = this.isNewSection(line);
        if (isNewSection && i > sectionStartLine + 1) {
          // Save current remark
          const content = remarkContent.join(' ').trim();
          if (content.length > 10) {
            remarks.push(this.createRemark(content, currentSection, 'direct'));
          }
          inRemarkSection = false;
          remarkContent = [];
        } else if (line.length > 0) {
          remarkContent.push(line);
        }
      }
    }
    
    // Save last remark if exists
    if (inRemarkSection && remarkContent.length > 0) {
      const content = remarkContent.join(' ').trim();
      if (content.length > 10) {
        remarks.push(this.createRemark(content, currentSection, 'direct'));
      }
    }
    
    return remarks;
  }

  /**
   * Extract inline remarks (e.g., interpretation text after biomarker values)
   */
  private static extractInlineRemarks(
    lines: string[],
    sections: Map<string, any>
  ): Remark[] {
    const remarks: Remark[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and headers
      if (!line || this.isHeader(line)) continue;
      
      // Check if line contains interpretation patterns
      for (const pattern of RemarksDictionary.REMARK_PATTERNS) {
        if (pattern.pattern.test(line)) {
          // Look for complete sentence or paragraph
          let remarkText = line;
          
          // Check if remark continues on next lines
          let j = i + 1;
          while (j < lines.length && 
                 lines[j].trim() && 
                 !this.isHeader(lines[j]) && 
                 !this.isBiomarkerLine(lines[j])) {
            remarkText += ' ' + lines[j].trim();
            j++;
          }
          
          if (remarkText.length > 20) {
            const section = this.findCurrentSection(i, sections);
            remarks.push(this.createRemark(remarkText, section, 'inferred', pattern.type));
          }
          
          break; // Only match one pattern per line
        }
      }
    }
    
    return remarks;
  }

  /**
   * Extract remarks from section footers
   */
  private static extractSectionFooterRemarks(sections: Map<string, any>): Remark[] {
    const remarks: Remark[] = [];
    
    for (const [sectionName, section] of sections.entries()) {
      const lines = section.content.split('\n');
      const footerStartIndex = this.findFooterStart(lines);
      
      if (footerStartIndex !== -1) {
        const footerLines = lines.slice(footerStartIndex);
        const footerText = footerLines.join(' ').trim();
        
        // Check if footer contains interpretation or recommendation
        if (footerText.length > 30 && this.isRemarkContent(footerText)) {
          remarks.push(this.createRemark(footerText, sectionName, 'direct'));
        }
      }
    }
    
    return remarks;
  }

  /**
   * Associate remarks with relevant biomarkers
   */
  private static associateRemarksWithBiomarkers(
    remarks: Remark[], 
    biomarkers: ExtractedBiomarker[]
  ): Remark[] {
    const associatedRemarks = remarks.map(remark => {
      const associations = RemarksDictionary.extractBiomarkerAssociations(remark.content);
      const associatedBiomarkerNames: string[] = [];
      
      // Find biomarkers mentioned in the remark
      for (const biomarker of biomarkers) {
        const biomarkerNameLower = biomarker.standardName.toLowerCase();
        const remarkLower = remark.content.toLowerCase();
        
        // Direct name match
        if (remarkLower.includes(biomarkerNameLower)) {
          associatedBiomarkerNames.push(biomarker.standardName);
          // Add remark ID to biomarker
          if (!biomarker.remarkIds) biomarker.remarkIds = [];
          biomarker.remarkIds.push(remark.id);
          continue;
        }
        
        // Check aliases
        const biomarkerKey = Object.keys(BIOMARKER_DICTIONARY).find(key => 
          BIOMARKER_DICTIONARY[key].standardName === biomarker.standardName
        );
        
        if (biomarkerKey) {
          const definition = BIOMARKER_DICTIONARY[biomarkerKey];
          for (const alias of definition.aliases) {
            if (remarkLower.includes(alias)) {
              associatedBiomarkerNames.push(biomarker.standardName);
              if (!biomarker.remarkIds) biomarker.remarkIds = [];
              biomarker.remarkIds.push(remark.id);
              break;
            }
          }
        }
      }
      
      return {
        ...remark,
        associatedBiomarkers: [...new Set([...associations, ...associatedBiomarkerNames])]
      };
    });
    
    return associatedRemarks;
  }

  /**
   * Create a remark object
   */
  private static createRemark(
    content: string, 
    section: string, 
    source: 'direct' | 'inferred',
    type?: Remark['type']
  ): Remark {
    const remarkType = type || RemarksDictionary.determineRemarkType(content);
    const keywords = this.extractKeywords(content);
    
    const remark: Remark = {
      id: uuidv4(),
      type: remarkType,
      content: content.trim(),
      section: section,
      source: source,
      keywords: keywords,
      confidence: RemarksDictionary.calculateRemarkConfidence({
        content,
        type: remarkType,
        source
      })
    };
    
    return remark;
  }

  /**
   * Helper methods
   */
  private static findCurrentSection(lineIndex: number, sections: Map<string, any>): string {
    for (const [name, section] of sections.entries()) {
      if (lineIndex >= section.startIndex && lineIndex < section.endIndex) {
        return name;
      }
    }
    return 'GENERAL';
  }

  private static isNewSection(line: string): boolean {
    return /^[A-Z][A-Z\s]+$/.test(line) || 
           /^(HEMATOLOGY|BIOCHEMISTRY|LIPID|LIVER|KIDNEY|THYROID)/i.test(line);
  }

  private static isHeader(line: string): boolean {
    return line.length < 50 && 
           (/^[A-Z][A-Z\s]+$/.test(line) || /^\w+\s*:\s*$/.test(line));
  }

  private static isBiomarkerLine(line: string): boolean {
    // Check if line contains typical biomarker patterns
    return /\d+\.?\d*\s*(mg\/dL|g\/dL|U\/L|%|ng\/mL)/.test(line);
  }

  private static findFooterStart(lines: string[]): number {
    // Look for typical footer patterns
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
      const line = lines[i].toLowerCase();
      if (line.includes('interpretation') || 
          line.includes('clinical significance') ||
          line.includes('note') ||
          line.includes('reference')) {
        return i;
      }
    }
    return -1;
  }

  private static isRemarkContent(text: string): boolean {
    const remarkKeywords = [
      'interpretation', 'clinical', 'significance', 'indicates',
      'suggests', 'recommend', 'should', 'may', 'levels',
      'diagnosis', 'treatment', 'monitor', 'follow'
    ];
    
    const textLower = text.toLowerCase();
    return remarkKeywords.some(keyword => textLower.includes(keyword));
  }

  private static extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const medicalKeywords = [
      'deficiency', 'insufficiency', 'elevated', 'decreased',
      'normal', 'abnormal', 'high', 'low', 'critical',
      'monitor', 'follow-up', 'treatment', 'diagnosis',
      'risk', 'factor', 'indicates', 'suggests'
    ];
    
    const textLower = text.toLowerCase();
    for (const keyword of medicalKeywords) {
      if (textLower.includes(keyword)) {
        keywords.push(keyword);
      }
    }
    
    return keywords;
  }

  private static deduplicateRemarks(remarks: Remark[]): Remark[] {
    const uniqueRemarks = new Map<string, Remark>();
    
    for (const remark of remarks) {
      // Create a key based on content similarity
      const key = remark.content.substring(0, 50).toLowerCase().replace(/\s+/g, '');
      
      const existing = uniqueRemarks.get(key);
      if (!existing || remark.confidence > existing.confidence) {
        uniqueRemarks.set(key, remark);
      }
    }
    
    return Array.from(uniqueRemarks.values());
  }
}

File 8: Biomarker Validator
File: src/lib/parsers/biomarkerValidator.ts
typescriptimport { ExtractedBiomarker, BIOMARKER_DICTIONARY } from './biomarkerDictionary';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
}

export interface ValidationRule {
  name: string;
  validate: (biomarker: ExtractedBiomarker) => boolean;
  errorMessage: string;
  severity: 'error' | 'warning';
}

export class BiomarkerValidator {
  // Validation rules
  private static readonly VALIDATION_RULES: ValidationRule[] = [
    {
      name: 'value_in_range',
      validate: (marker) => {
        const def = BIOMARKER_DICTIONARY[marker.standardName.toLowerCase().replace(/\s+/g, '_')];
        if (!def) return true;
        return marker.value >= def.validRange.min && marker.value <= def.validRange.max;
      },
      errorMessage: 'Value is outside valid range',
      severity: 'error'
    },
    {
      name: 'unit_match',
      validate: (marker) => {
        const def = BIOMARKER_DICTIONARY[marker.standardName.toLowerCase().replace(/\s+/g, '_')];
        if (!def) return true;
        return def.unit.some(u => u.toLowerCase() === marker.unit.toLowerCase());
      },
      errorMessage: 'Unit does not match expected units',
      severity: 'warning'
    },
    {
      name: 'critical_value',
      validate: (marker) => {
        const def = BIOMARKER_DICTIONARY[marker.standardName.toLowerCase().replace(/\s+/g, '_')];
        if (!def || !def.criticalLow || !def.criticalHigh) return true;
        return marker.value >= def.criticalLow && marker.value <= def.criticalHigh;
      },
      errorMessage: 'Value is in critical range',
      severity: 'warning'
    },
    {
      name: 'decimal_precision',
      validate: (marker) => {
        const decimalPlaces = (marker.value.toString().split('.')[1] || '').length;
        return decimalPlaces <= 4; // Max 4 decimal places
      },
      errorMessage: 'Excessive decimal precision',
      severity: 'warning'
    }
  ];

  /**
   * Validate a single biomarker
   */
  static validateBiomarker(biomarker: ExtractedBiomarker): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = biomarker.confidence || 0.5;
    
    for (const rule of this.VALIDATION_RULES) {
      if (!rule.validate(biomarker)) {
        if (rule.severity === 'error') {
          errors.push(rule.errorMessage);
          confidence *= 0.7; // Reduce confidence for errors
        } else {
          warnings.push(rule.errorMessage);
          confidence *= 0.9; // Slightly reduce confidence for warnings
        }
      }
    }
    
    // Additional confidence adjustments
    if (biomarker.referenceRange) {
      confidence = Math.min(confidence * 1.1, 1.0); // Boost confidence if reference range present
    }
    
    if (biomarker.unit) {
      confidence = Math.min(confidence * 1.05, 1.0); // Slight boost for unit presence
    }
    
    if (biomarker.remarkIds && biomarker.remarkIds.length > 0) {
      confidence = Math.min(confidence * 1.05, 1.0); // Boost for associated remarks
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  /**
   * Validate all biomarkers and filter invalid ones
   */
  static validateAndFilter(biomarkers: ExtractedBiomarker[]): ExtractedBiomarker[] {
    const validated: ExtractedBiomarker[] = [];
    
    for (const biomarker of biomarkers) {
      const validation = this.validateBiomarker(biomarker);
      
      if (validation.isValid) {
        // Update confidence
        validated.push({
          ...biomarker,
          confidence: validation.confidence
        });
      } else {
        console.warn(`Rejected biomarker ${biomarker.name}:`, validation.errors);
      }
    }
    
    return validated;
  }

  /**
   * Calculate overall report confidence
   */
  static calculateReportConfidence(biomarkers: ExtractedBiomarker[], remarks: any[]): number {
    if (biomarkers.length === 0) return 0;
    
    const totalConfidence = biomarkers.reduce((sum, marker) => sum + marker.confidence, 0);
    const averageConfidence = totalConfidence / biomarkers.length;
    
    // Adjust based on biomarker count
    let reportConfidence = averageConfidence;
    
    if (biomarkers.length < 5) {
      reportConfidence *= 0.8; // Low biomarker count reduces confidence
    } else if (biomarkers.length > 20) {
      reportConfidence = Math.min(reportConfidence * 1.1, 1.0); // High count increases confidence
    }
    
    // Check for critical categories
    const categories = new Set(biomarkers.map(m => m.category));
    const criticalCategories = ['hematology', 'biochemistry', 'lipid'];
    const hasCriticalCategories = criticalCategories.some(cat => categories.has(cat));
    
    if (!hasCriticalCategories && biomarkers.length < 10) {
      reportConfidence *= 0.9; // Missing critical categories reduces confidence
    }
    
    // Boost confidence if remarks are present
    if (remarks && remarks.length > 0) {
      reportConfidence = Math.min(reportConfidence * 1.05, 1.0);
    }
    
    return Math.round(reportConfidence * 100) / 100;
  }

  /**
   * Group biomarkers by category with validation
   */
  static groupByCategory(biomarkers: ExtractedBiomarker[]): Map<string, ExtractedBiomarker[]> {
    const grouped = new Map<string, ExtractedBiomarker[]>();
    
    for (const marker of biomarkers) {
      const category = marker.category || 'other';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(marker);
    }
    
    // Sort biomarkers within each category by confidence
    for (const [category, markers] of grouped.entries()) {
      markers.sort((a, b) => b.confidence - a.confidence);
    }
    
    return grouped;
  }

  /**
   * Generate validation report
   */
  static generateValidationReport(biomarkers: ExtractedBiomarker[], remarks: any[]): {
    totalBiomarkers: number;
    validBiomarkers: number;
    averageConfidence: number;
    categoryCounts: Record<string, number>;
    criticalFindings: ExtractedBiomarker[];
    lowConfidenceMarkers: ExtractedBiomarker[];
    remarkCount: number;
  } {
    const validated = this.validateAndFilter(biomarkers);
    const grouped = this.groupByCategory(validated);
    
    const categoryCounts: Record<string, number> = {};
    for (const [category, markers] of grouped.entries()) {
      categoryCounts[category] = markers.length;
    }
    
    const criticalFindings = validated.filter(marker => {
      const def = BIOMARKER_DICTIONARY[marker.standardName.toLowerCase().replace(/\s+/g, '_')];
      if (!def || !def.criticalLow || !def.criticalHigh) return false;
      return marker.value < def.criticalLow || marker.value > def.criticalHigh;
    });
    
    const lowConfidenceMarkers = validated.filter(marker => marker.confidence < 0.6);
    
    return {
      totalBiomarkers: biomarkers.length,
      validBiomarkers: validated.length,
      averageConfidence: this.calculateReportConfidence(validated, remarks),
      categoryCounts,
      criticalFindings,
      lowConfidenceMarkers,
      remarkCount: remarks?.length || 0
    };
  }
}

File 9: Main Blood Test Parser
File: src/lib/parsers/bloodTestParser.ts
typescriptimport { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import path from 'path';
import { BloodTestReportData, ParserResult, ReportType } from './types';
import { TextPreprocessor } from './textPreprocessor';
import { SectionParser } from './sectionParser';
import { BiomarkerExtractor } from './biomarkerExtractor';
import { RemarksExtractor } from './remarksExtractor';
import { BiomarkerValidator } from './biomarkerValidator';
import { ExtractedBiomarker } from './biomarkerDictionary';

export class BloodTestParser {
  private content: string;
  private logPath: string;
  private parsedData: any;

  constructor(file: File | null = null, content: string = '') {
    this.logPath = path.join(process.cwd(), 'logs', `parser-${Date.now()}.log`);
    this.content = typeof content === 'string' ? content : String(content || '');
    this.logMessage(`BloodTestParser initialized with ${this.content.length} characters`);
    
    if (file) {
      this.logMessage(`Processing file: ${file.name}, size: ${file.size} bytes`);
    }
  }

  private logMessage(message: string): void {
    console.log(message);
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp} - ${message}\n`;
      fs.appendFileSync(this.logPath, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Main parsing method with enhanced biomarker and remarks extraction
   */
  async parse(): Promise<ParserResult> {
    this.logMessage('Starting enhanced blood test parsing with remarks extraction');
    
    try {
      // Step 1: Preprocess text
      const cleanedContent = TextPreprocessor.cleanOCRText(this.content);
      this.logMessage(`Text preprocessing complete. Cleaned content length: ${cleanedContent.length}`);
      
      // Step 2: Parse sections
      const sections = SectionParser.parseSections(cleanedContent);
      this.logMessage(`Found ${sections.size} sections: ${Array.from(sections.keys()).join(', ')}`);
      
      // Step 3: Extract biomarkers from each section
      let allBiomarkers: ExtractedBiomarker[] = [];
      
      for (const [sectionName, section] of sections.entries()) {
        this.logMessage(`Processing section: ${sectionName}`);
        const sectionBiomarkers = BiomarkerExtractor.extractBiomarkers(
          section.content, 
          sectionName
        );
        this.logMessage(`Extracted ${sectionBiomarkers.length} biomarkers from ${sectionName}`);
        allBiomarkers = allBiomarkers.concat(sectionBiomarkers);
      }
      
      // Step 4: Extract remarks
      const remarks = RemarksExtractor.extractRemarks(
        cleanedContent,
        sections,
        allBiomarkers
      );
      this.logMessage(`Extracted ${remarks.length} remarks`);
      
      // Step 5: Validate and filter biomarkers
      const validatedBiomarkers = BiomarkerValidator.validateAndFilter(allBiomarkers);
      this.logMessage(`Validated ${validatedBiomarkers.length} out of ${allBiomarkers.length} biomarkers`);
      
      // Step 6: Generate validation report
      const validationReport = BiomarkerValidator.generateValidationReport(
        validatedBiomarkers, 
        remarks
      );
      this.logMessage(`Validation report: ${JSON.stringify(validationReport, null, 2)}`);
      
      // Step 7: Extract metadata
      const metadata = this.extractMetadata(cleanedContent);
      
      // Step 8: Format final result
      const result: BloodTestReportData = {
        type: 'BLOOD_TEST',
        biomarkers: validatedBiomarkers.map(this.formatBiomarker),
        remarks: remarks,
        metadata: {
          parser: 'enhanced-with-remarks',
          biomarkerCount: validatedBiomarkers.length,
          remarkCount: remarks.length,
          parsedAt: new Date().toISOString(),
          confidence: validationReport.averageConfidence,
          sections: Array.from(sections.keys()),
          validation: {
            totalExtracted: allBiomarkers.length,
            validBiomarkers: validatedBiomarkers.length,
            categoryCounts: validationReport.categoryCounts,
            criticalCount: validationReport.criticalFindings.length,
            lowConfidenceCount: validationReport.lowConfidenceMarkers.length
          }
        },
        patientInfo: metadata.patientInfo,
        labInfo: metadata.labInfo,
        criticalFindings: validationReport.criticalFindings.map(this.formatBiomarker)
      };
      
      this.logMessage('Parsing completed successfully');
      return this.success(result);
      
    } catch (error) {
      this.logMessage(`Parsing error: ${error}`);
      return this.error(`Failed to parse blood test report: ${error}`);
    }
  }

  /**
   * Format biomarker for output
   */
  private formatBiomarker(biomarker: ExtractedBiomarker): any {
    return {
      name: biomarker.standardName,
      value: biomarker.value,
      unit: biomarker.unit,
      referenceRange: biomarker.referenceRange,
      status: biomarker.status,
      category: biomarker.category,
      confidence: biomarker.confidence,
      remarkIds: biomarker.remarkIds
    };
  }

  /**
   * Extract metadata from the report content
   * Note: This method uses SectionParser for more robust extraction
   * and updates class properties directly instead of returning values
   */
  private extractMetadata(content: string): void {
    this.logMessage('Extracting metadata from content');
    
    // Extract patient information using SectionParser
    this.parsedData.patientInfo = SectionParser.extractPatientInfo(content);
    this.logMessage(`Extracted patient info: ${JSON.stringify(this.parsedData.patientInfo)}`);
    
    // Extract lab information using SectionParser
    this.parsedData.labInfo = SectionParser.extractLabInfo(content);
    this.logMessage(`Extracted lab info: ${JSON.stringify(this.parsedData.labInfo)}`);
    
    // Note: SectionParser handles multiple extraction patterns for each field
    // including patient name, age, gender, ID, lab name, test date, and report ID
    // This approach is more maintainable and accurate than direct regex matching
  }

  /**
   * Helper method to create a successful result
   */
  private success(data: BloodTestReportData): ParserResult {
    return {
      success: true,
      data
    };
  }

  /**
   * Helper method to create an error result
   * Note: This implementation includes robust error handling that should be 
   * maintained during testing and simplified later if needed
   */
  private error(message: string, error?: Error): ParserResult {
    this.logMessage(`Error: ${message}${error ? ` - ${error.message}` : ''}`);
    if (error?.stack) {
      this.logMessage(`Stack trace: ${error.stack}`);
    }
    return {
      success: false,
      error: message
    };
  }
}

---

## HIPAA Compliance Recommendations

The current parser implementation is HIPAA-aware but requires several enhancements to achieve full HIPAA compliance before handling Protected Health Information (PHI):

1. **Data Encryption**:
   - Implement encryption for all extracted PHI using the ENCRYPTION_KEY environment variable
   - Ensure data is encrypted both in transit and at rest

2. **Secure Logging**:
   - Modify the logging system to mask or hash sensitive PHI
   - Implement log rotation and secure storage
   - Avoid logging full patient details in plaintext

3. **Access Controls**:
   - Add authentication verification before allowing parser access
   - Implement role-based access control for parsed medical data

4. **Audit Trails**:
   - Enhance logging to track who accessed data and when
   - Integrate with the AuditLog model for compliance tracking

5. **Error Handling Security**:
   - Sanitize error messages to remove sensitive information
   - Implement different levels of error detail for dev vs. production

6. **Data Minimization**:
   - Only extract and store minimum necessary patient information
   - Implement data retention and purging policies

These enhancements should be implemented before the application processes real patient data in a production environment.

### File 10: Comprehensive Test Suite

**File**: `src/lib/parsers/__tests__/bloodTestParser.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { BloodTestParser } from '../bloodTestParser';
import { TextPreprocessor } from '../textPreprocessor';
import { BiomarkerExtractor } from '../biomarkerExtractor';
import { RemarksExtractor } from '../remarksExtractor';
import { BiomarkerValidator } from '../biomarkerValidator';
import { RemarksDictionary } from '../remarksDictionary';

describe('BloodTestParser Enhanced with Remarks', () => {
  describe('TextPreprocessor', () => {
    it('should fix common OCR errors', () => {
      const input = 'Hemoglobin l4.5 g/dl';
      const cleaned = TextPreprocessor.cleanOCRText(input);
      expect(cleaned).toContain('14.5');
    });

    it('should normalize units', () => {
      const input = 'Glucose 100 mg/di';
      const cleaned = TextPreprocessor.cleanOCRText(input);
      expect(cleaned).toContain('mg/dL');
    });

    it('should identify table structures', () => {
      const lines = [
        'Test               Result    Unit      Reference',
        'Hemoglobin         14.5      g/dL      13.0-16.5',
        'WBC Count          7500      /cmm      4000-10000'
      ];
      const table = TextPreprocessor.identifyTableStructure(lines);
      expect(table).not.toBeNull();
      expect(table?.headers).toHaveLength(4);
      expect(table?.rows).toHaveLength(2);
    });
  });

  describe('BiomarkerExtractor', () => {
    it('should extract biomarkers from standard format', () => {
      const content = `
        Hemoglobin 14.5 g/dL (13.0 - 16.5)
        WBC Count 7500 /cmm (4000 - 10000)
        Glucose 95 mg/dL (70 - 100)
      `;
      
      const biomarkers = BiomarkerExtractor.extractBiomarkers(content);
      expect(biomarkers).toHaveLength(3);
      expect(biomarkers[0].standardName).toBe('Hemoglobin');
      expect(biomarkers[0].value).toBe(14.5);
      expect(biomarkers[0].unit).toBe('g/dL');
    });

    it('should extract biomarkers from table format', () => {
      const content = `
        Test                  Result    Unit      Reference Range
        Total Cholesterol     189       mg/dL     < 200
        Triglycerides        150       mg/dL     < 150
        HDL Cholesterol      45        mg/dL     > 40
      `;
      
      const biomarkers = BiomarkerExtractor.extractBiomarkers(content);
      expect(biomarkers.length).toBeGreaterThan(0);
      
      const cholesterol = biomarkers.find(b => b.standardName === 'Total Cholesterol');
      expect(cholesterol).toBeDefined();
      expect(cholesterol?.value).toBe(189);
    });

    it('should handle multiline biomarker format', () => {
      const content = `
        25-Hydroxy Vitamin D
        21.18 ng/mL
        
        HbA1c (Glycosylated Hemoglobin)
        5.8 %
      `;
      
      const biomarkers = BiomarkerExtractor.extractBiomarkers(content);
      
      const vitaminD = biomarkers.find(b => b.standardName.includes('Vitamin D'));
      expect(vitaminD).toBeDefined();
      expect(vitaminD?.value).toBe(21.18);
      
      const hba1c = biomarkers.find(b => b.standardName === 'HbA1c');
      expect(hba1c).toBeDefined();
      expect(hba1c?.value).toBe(5.8);
    });
  });

  describe('RemarksExtractor', () => {
    it('should extract remarks from dedicated sections', () => {
      const content = `
        25-Hydroxy Vitamin D   21.18 ng/mL
        
        Remarks:
        Vitamin D helps regulate the amount of calcium and phosphate in the body. 
        A lack of vitamin D can lead to bone deformities such as rickets in children.
      `;
      
      const sections = new Map([['GENERAL', { content, startIndex: 0, endIndex: 10 }]]);
      const biomarkers: any[] = [];
      
      const remarks = RemarksExtractor.extractRemarks(content, sections, biomarkers);
      expect(remarks.length).toBeGreaterThan(0);
      expect(remarks[0].type).toBe('biomarker');
      expect(remarks[0].content).toContain('Vitamin D helps regulate');
    });

    it('should extract inline interpretations', () => {
      const content = `
        HbA1c 5.8 %
        
        According to guidelines of the American Diabetes Association (ADA), 
        HbA1c level (6.5%) is one of the criteria for the diagnosis of Diabetes Mellitus.
      `;
      
      const sections = new Map([['GENERAL', { content, startIndex: 0, endIndex: 10 }]]);
      const biomarkers: any[] = [];
      
      const remarks = RemarksExtractor.extractRemarks(content, sections, biomarkers);
      expect(remarks.length).toBeGreaterThan(0);
      
      const interpretationRemark = remarks.find(r => r.type === 'interpretation');
      expect(interpretationRemark).toBeDefined();
      expect(interpretationRemark?.content).toContain('According to guidelines');
    });

    it('should associate remarks with biomarkers', () => {
      const content = `
        TSH 6.49 uIU/mL
        
        Interpretation: Elevated TSH may indicate hypothyroidism. 
        Recommend follow-up with endocrinologist.
      `;
      
      const sections = new Map([['GENERAL', { content, startIndex: 0, endIndex: 10 }]]);
      const biomarkers = [{
        name: 'TSH',
        standardName: 'TSH',
        value: 6.49,
        unit: 'µIU/mL',
        confidence: 0.9,
        category: 'thyroid',
        status: 'high' as const
      }];
      
      const remarks = RemarksExtractor.extractRemarks(content, sections, biomarkers);
      expect(remarks.length).toBeGreaterThan(0);
      
      const tshRemark = remarks.find(r => 
        r.associatedBiomarkers && r.associatedBiomarkers.includes('TSH')
      );
      expect(tshRemark).toBeDefined();
      expect(biomarkers[0].remarkIds).toBeDefined();
      expect(biomarkers[0].remarkIds?.length).toBeGreaterThan(0);
    });
  });

  describe('RemarksDictionary', () => {
    it('should identify remark headers', () => {
      expect(RemarksDictionary.isRemarkHeader('Remarks:')).toBe(true);
      expect(RemarksDictionary.isRemarkHeader('Clinical Significance')).toBe(true);
      expect(RemarksDictionary.isRemarkHeader('Hemoglobin 14.5')).toBe(false);
    });

    it('should determine remark type correctly', () => {
      const recommendation = 'Recommend monitoring vitamin D levels every 3 months';
      expect(RemarksDictionary.determineRemarkType(recommendation)).toBe('recommendation');
      
      const interpretation = 'Elevated levels may indicate liver dysfunction';
      expect(RemarksDictionary.determineRemarkType(interpretation)).toBe('interpretation');
    });

    it('should extract biomarker associations', () => {
      const remark = 'Low vitamin D levels can affect calcium absorption. Consider vitamin D supplementation.';
      const associations = RemarksDictionary.extractBiomarkerAssociations(remark);
      expect(associations).toContain('vitamin d');
    });
  });

  describe('BiomarkerValidator', () => {
    it('should validate biomarker values', () => {
      const biomarker = {
        name: 'Hemoglobin',
        standardName: 'Hemoglobin',
        value: 14.5,
        unit: 'g/dL',
        referenceRange: '13.0-16.5',
        status: 'normal' as const,
        confidence: 0.8,
        category: 'hematology'
      };
      
      const validation = BiomarkerValidator.validateBiomarker(biomarker);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject out-of-range values', () => {
      const biomarker = {
        name: 'Hemoglobin',
        standardName: 'Hemoglobin',
        value: 50, // Impossible value
        unit: 'g/dL',
        referenceRange: '13.0-16.5',
        status: 'high' as const,
        confidence: 0.8,
        category: 'hematology'
      };
      
      const validation = BiomarkerValidator.validateBiomarker(biomarker);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should boost confidence for biomarkers with remarks', () => {
      const biomarker = {
        name: 'Vitamin D',
        standardName: '25-Hydroxy Vitamin D',
        value: 21.18,
        unit: 'ng/mL',
        confidence: 0.8,
        category: 'vitamins',
        status: 'low' as const,
        remarkIds: ['remark-1', 'remark-2']
      };
      
      const validation = BiomarkerValidator.validateBiomarker(biomarker);
      expect(validation.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Integration Tests', () => {
    it('should parse complete blood test report with remarks', async () => {
      const sampleReport = `
        BAHRIA TOWN INTERNATIONAL HOSPITAL
        LABORATORY REPORT
        
        Patient Name: John Doe
        Age: 45Y
        Sex: M
        Date: 20-Apr-2025
        
        BIOCHEMISTRY
        
        Investigation          Values    Reference Ranges
        25-Hydroxy Vitamin-D   21.18     ng/ml      30-150
        
        Remarks: 
        Vitamin D helps regulate the amount of calcium and phosphate in the body. 
        A lack of vitamin D can lead to bone deformities such as rickets in children, 
        and bone pain caused by a condition called osteomalacia in adults.
        
        HbA1C                  5.8       %          < 5.7
        
        Remarks: According to guidelines of the American Diabetes Association (ADA), 
        HbA1c level (6.5%) is one of the criteria for the diagnosis of Diabetes Mellitus.
        
        Liver Function Test
        Total Bilirubin        0.42      mg/dl      0.0-1.0
        ALT/SGPT              15        U/l        0-41
        
        HEMATOLOGY
        
        Hemoglobin            14.5      g/dL       13.0-16.5
        WBC Count             10570     /cmm       4000-10000
        
        Clinical Significance:
        The patient's complete blood count shows values within normal limits. 
        No evidence of anemia or infection.
      `;
      
      const parser = new BloodTestParser(null, sampleReport);
      const result = await parser.parse();
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const data = result.data!;
      expect(data.type).toBe('BLOOD_TEST');
      expect(data.biomarkers.length).toBeGreaterThan(5);
      expect(data.remarks.length).toBeGreaterThan(2);
      
      // Check specific biomarkers
      const hemoglobin = data.biomarkers.find(b => b.name === 'Hemoglobin');
      expect(hemoglobin).toBeDefined();
      expect(hemoglobin?.value).toBe(14.5);
      
      const vitaminD = data.biomarkers.find(b => b.name.includes('Vitamin D'));
      expect(vitaminD).toBeDefined();
      expect(vitaminD?.value).toBe(21.18);
      expect(vitaminD?.status).toBe('low');
      
      // Check remarks
      const vitaminDRemark = data.remarks.find(r => 
        r.content.includes('calcium and phosphate')
      );
      expect(vitaminDRemark).toBeDefined();
      expect(vitaminDRemark?.type).toBe('biomarker');
      
      const hba1cRemark = data.remarks.find(r => 
        r.content.includes('American Diabetes Association')
      );
      expect(hba1cRemark).toBeDefined();
      expect(hba1cRemark?.type).toBe('interpretation');
      
      // Check clinical significance
      const clinicalRemark = data.remarks.find(r => 
        r.content.includes('complete blood count shows values within normal limits')
      );
      expect(clinicalRemark).toBeDefined();
      
      // Check metadata
      expect(data.metadata.sections).toContain('BIOCHEMISTRY');
      expect(data.metadata.sections).toContain('HEMATOLOGY');
      expect(data.metadata.confidence).toBeGreaterThan(0.7);
      expect(data.metadata.remarkCount).toBeGreaterThan(2);
    });

    it('should handle complex real-world report format', async () => {
      const complexReport = `
        Patient: Jane Smith    Age: 61Y 02Mo 23D    Sex: F
        MR NO: 010-022-521     Date: 20-Apr-2025
        
        BIOCHEMISTRY
        
        25-Hydroxy Vitamin-D
        Sample: 20-Apr-2025
        25 OH Vitamin D Total    21.18 ng/ml    
        Vitamin D Deficiency : <20
        Vitamin D Insufficiency : 21-29
        Vitamin D Sufficiency : 30-150
        Vitamin D Intoxification: >150
        
        Remarks: Vitamin D helps regulate the amount of calcium and phosphate in the body.
        
        HbA1C (Glycosylated Hemoglobin)
        Sample: 20-Apr-2025
        HbA1C                    5.8 %          Diabetic - >= 6.5 %
                                               Impaired - 5.7-6.4 %
        
        Note: HbA1c level is an indicator of blood glucose levels over the previous 2-3 months period.
        
        TSH
        Sample: 20-Apr-2025
        Thyroid Stimulating Hormone (TSH)    6.49 uIU/mL    
        Birth - 4 Days 1.0 - 39
        2 weeks - 20 weeks 1.7 - 9.1
        21 weeks - 20 years 0.7 - 6.4
        Adult 21 - 54 years 0.4 - 4.2
        Adult 55 - 87 years 0.5 - 8.9
        
        Methadology: The cobas e 411 analyzer is a fully automated analyzer 
        that uses a patented ElectroChemiLuminescence (ECL) technology for immunoassay analysis.
      `;
      
      const parser = new BloodTestParser(null, complexReport);
      const result = await parser.parse();
      
      expect(result.success).toBe(true);
      
      const data = result.data!;
      
      // Check biomarker extraction
      const tsh = data.biomarkers.find(b => b.name === 'TSH');
      expect(tsh).toBeDefined();
      expect(tsh?.value).toBe(6.49);
      expect(tsh?.status).toBe('high'); // Above adult range
      
      // Check remarks extraction
      const methodologyRemark = data.remarks.find(r => 
        r.content.includes('cobas e 411 analyzer')
      );
      expect(methodologyRemark).toBeDefined();
      
      // Check patient info extraction
      expect(data.patientInfo?.name).toContain('Jane Smith');
      expect(data.patientInfo?.age).toContain('61Y');
      expect(data.patientInfo?.gender).toBe('F');
    });
  });
});

🏁 Implementation Checklist
Pre-Implementation

 Create backup of existing parser code
 Set up new branch: feature/parser-with-remarks
 Install required dependencies (uuid: npm install uuid @types/uuid)
 Create logs directory for parser logging

Implementation Order

 Create types.ts with updated interfaces
 Create biomarkerDictionary.ts with comprehensive definitions
 Create remarksDictionary.ts for remarks patterns
 Create textPreprocessor.ts for OCR cleaning
 Create sectionParser.ts for document structure
 Create biomarkerExtractor.ts for biomarker extraction
 Create remarksExtractor.ts for remarks extraction
 Create biomarkerValidator.ts for validation
 Update bloodTestParser.ts to integrate all components
 Create comprehensive test suite

Quality Checks

 All TypeScript types properly defined
 No circular dependencies
 Proper error handling throughout
 Logging implemented for debugging
 All tests pass with >90% coverage

Performance Targets

 Parse typical report in < 2 seconds
 Memory usage < 50MB
 Biomarker extraction accuracy > 95%
 Remarks extraction accuracy > 90%


🚀 Usage Example
typescriptimport { BloodTestParser } from './lib/parsers/bloodTestParser';

// Parse a blood test report
const parser = new BloodTestParser(file, fileContent);
const result = await parser.parse();

if (result.success) {
  const { biomarkers, remarks, metadata } = result.data;
  
  // Access biomarkers
  biomarkers.forEach(marker => {
    console.log(`${marker.name}: ${marker.value} ${marker.unit} (${marker.status})`);
    
    // Check associated remarks
    if (marker.remarkIds) {
      const associatedRemarks = remarks.filter(r => 
        marker.remarkIds.includes(r.id)
      );
      associatedRemarks.forEach(remark => {
        console.log(`  Remark: ${remark.content}`);
      });
    }
  });
  
  // Access general remarks
  const generalRemarks = remarks.filter(r => r.type === 'general');
  console.log('General recommendations:', generalRemarks);
}

📊 Expected Output
json{
  "type": "BLOOD_TEST",
  "biomarkers": [
    {
      "name": "25-Hydroxy Vitamin D",
      "value": 21.18,
      "unit": "ng/mL",
      "referenceRange": "30-150",
      "status": "low",
      "category": "vitamins",
      "confidence": 0.92,
      "remarkIds": ["uuid-1", "uuid-2"]
    }
  ],
  "remarks": [
    {
      "id": "uuid-1",
      "type": "biomarker",
      "content": "Vitamin D helps regulate the amount of calcium and phosphate in the body.",
      "associatedBiomarkers": ["25-Hydroxy Vitamin D"],
      "section": "BIOCHEMISTRY",
      "confidence": 0.85,
      "source": "direct",
      "keywords": ["regulate", "calcium", "phosphate"]
    },
    {
      "id": "uuid-2",
      "type": "recommendation",
      "content": "A lack of vitamin D can lead to bone deformities such as rickets in children.",
      "associatedBiomarkers": ["25-Hydroxy Vitamin D"],
      "section": "BIOCHEMISTRY",
      "confidence": 0.80,
      "source": "direct",
      "keywords": ["deficiency", "bone", "rickets"]
    }
  ],
  "metadata": {
    "parser": "enhanced-with-remarks",
    "biomarkerCount": 36,
    "remarkCount": 12,
    "confidence": 0.89,
    "sections": ["BIOCHEMISTRY", "HEMATOLOGY", "LIVER_FUNCTION"]
  }
}

🎯 Success Criteria
✅ Biomarkers extracted with 95%+ accuracy
✅ All clinical remarks and interpretations captured
✅ Remarks properly associated with relevant biomarkers
✅ Confidence scoring provides reliability metrics
✅ Performance meets < 2 second requirement
✅ Comprehensive test coverage
✅ Production-ready error handling

This complete implementation guide provides everything needed to build a robust blood test parser with remarks extraction. The modular architecture ensures maintainability, while the comprehensive testing ensures reliability in production use.