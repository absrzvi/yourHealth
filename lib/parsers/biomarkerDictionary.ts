import { ExtractedBiomarker } from './types';

// Comprehensive biomarker type definitions
export interface BiomarkerDefinition {
  standardName: string;
  aliases: string[];
  category: string;
  unit: string[];
  validRange: { min: number; max: number };
  criticalLow?: number;
  criticalHigh?: number;
}

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
  // RENAL FUNCTION & METABOLIC
  'creatinine': {
    standardName: 'Creatinine',
    aliases: ['creatinine', 'creat', 'serum creatinine', 'scr'],
    category: 'Renal Function',
    unit: ['mg/dL', 'mg/dl', 'µmol/L', 'umol/L'],
    validRange: { min: 0.5, max: 1.5 }, // General adult, varies by sex/muscle mass
    criticalHigh: 5.0
  },
  'bun': {
    standardName: 'Blood Urea Nitrogen',
    aliases: ['bun', 'blood urea nitrogen', 'urea nitrogen', 'sun', 'serum urea nitrogen'],
    category: 'Renal Function',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 6, max: 24 },
    criticalHigh: 100
  },
  'urea': {
    standardName: 'Urea',
    aliases: ['urea', 'serum urea', 'blood urea'], // Distinct from BUN but related
    category: 'Renal Function',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 10, max: 50 }, // Approx range, often calculated from BUN
  },
  'egfr': {
    standardName: 'eGFR',
    aliases: ['egfr', 'estimated glomerular filtration rate', 'gfr'],
    category: 'Renal Function',
    unit: ['mL/min/1.73m²', 'ml/min/1.73m2'],
    validRange: { min: 60, max: 120 } // Lower indicates kidney disease
  },
  'glucose': {
    standardName: 'Glucose',
    aliases: ['glucose', 'blood sugar', 'fbs', 'fasting blood sugar', 'glu', 'gluc'],
    category: 'Metabolic',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 65, max: 99 }, // Fasting
    criticalLow: 40,
    criticalHigh: 400
  },
  // ELECTROLYTES
  'sodium': {
    standardName: 'Sodium',
    aliases: ['sodium', 'na', 'serum sodium'],
    category: 'Electrolytes',
    unit: ['mEq/L', 'meq/l', 'mmol/L'],
    validRange: { min: 135, max: 145 },
    criticalLow: 120,
    criticalHigh: 160
  },
  'potassium': {
    standardName: 'Potassium',
    aliases: ['potassium', 'k', 'serum potassium'],
    category: 'Electrolytes',
    unit: ['mEq/L', 'meq/l', 'mmol/L'],
    validRange: { min: 3.5, max: 5.2 },
    criticalLow: 2.5,
    criticalHigh: 6.5
  },
  'chloride': {
    standardName: 'Chloride',
    aliases: ['chloride', 'cl', 'serum chloride'],
    category: 'Electrolytes',
    unit: ['mEq/L', 'meq/l', 'mmol/L'],
    validRange: { min: 98, max: 107 }
  },
  'total_co2': {
    standardName: 'Total Carbon Dioxide',
    aliases: ['total carbon dioxide', 'total co2', 'tco2', 'bicarbonate', 'hco3', 'co2 content'],
    category: 'Electrolytes',
    unit: ['mEq/L', 'meq/l', 'mmol/L'],
    validRange: { min: 20, max: 32 }
  },
  'calcium': {
    standardName: 'Calcium',
    aliases: ['calcium', 'ca', 'total calcium', 'serum calcium'],
    category: 'Electrolytes',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 8.5, max: 10.5 }, // Total Calcium
    criticalLow: 6.0,
    criticalHigh: 13.0
  },
  'magnesium': {
    standardName: 'Magnesium',
    aliases: ['magnesium', 'mg', 'serum magnesium'],
    category: 'Electrolytes',
    unit: ['mg/dL', 'mg/dl', 'mEq/L', 'meq/l', 'mmol/L'],
    validRange: { min: 1.6, max: 2.6 }
  },
  'phosphate': {
    standardName: 'Phosphate',
    aliases: ['phosphate', 'phosphorus', 'po4', 'p'],
    category: 'Electrolytes',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 2.5, max: 4.5 }
  },
  // LIVER FUNCTION & PROTEINS
  'total_protein': {
    standardName: 'Total Protein',
    aliases: ['total protein', 'protein total', 'tp'],
    category: 'Liver Function',
    unit: ['g/dL', 'g/dl', 'g/L'],
    validRange: { min: 6.0, max: 8.3 }
  },
  'albumin': {
    standardName: 'Albumin',
    aliases: ['albumin', 'alb', 'serum albumin'],
    category: 'Liver Function',
    unit: ['g/dL', 'g/dl', 'g/L'],
    validRange: { min: 3.5, max: 5.5 }
  },
  'globulin': {
    standardName: 'Globulin',
    aliases: ['globulin', 'glob'], // Often calculated: Total Protein - Albumin
    category: 'Liver Function',
    unit: ['g/dL', 'g/dl', 'g/L'],
    validRange: { min: 2.0, max: 3.5 }
  },
  'ag_ratio': {
    standardName: 'A/G Ratio',
    aliases: ['a/g ratio', 'ag ratio', 'albumin globulin ratio'], // Calculated
    category: 'Liver Function',
    unit: [], // Ratio, no unit
    validRange: { min: 1.0, max: 2.5 }
  },
  'alt': {
    standardName: 'Alanine Aminotransferase',
    aliases: ['alt', 'sgpt', 'alanine transaminase'],
    category: 'Liver Function',
    unit: ['IU/L', 'U/L'],
    validRange: { min: 7, max: 56 }
  },
  'ast': {
    standardName: 'Aspartate Aminotransferase',
    aliases: ['ast', 'sgot', 'aspartate transaminase'],
    category: 'Liver Function',
    unit: ['IU/L', 'U/L'],
    validRange: { min: 10, max: 40 }
  },
  'alp': {
    standardName: 'Alkaline Phosphatase',
    aliases: ['alp', 'alk phos', 'alkaline phos'],
    category: 'Liver Function',
    unit: ['IU/L', 'U/L'],
    validRange: { min: 30, max: 120 } // Varies with age/sex
  },
  'total_bilirubin': {
    standardName: 'Total Bilirubin',
    aliases: ['total bilirubin', 'bilirubin total', 'tbili', 'direct bilirubin', 'indirect bilirubin'], // Note: direct/indirect are separate tests but often OCR'd near total
    category: 'Liver Function',
    unit: ['mg/dL', 'mg/dl', 'µmol/L', 'umol/l'],
    validRange: { min: 0.1, max: 1.2 },
    criticalHigh: 15.0
  },
  // LIPID PANEL
  'total_cholesterol': {
    standardName: 'Total Cholesterol',
    aliases: ['total cholesterol', 'cholesterol total', 'chol', 'cholest'],
    category: 'Lipid Panel',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 100, max: 200 } // Desirable <200
  },
  'hdl_cholesterol': {
    standardName: 'HDL Cholesterol',
    aliases: ['hdl cholesterol', 'hdl', 'hdl-c', 'high density lipoprotein'],
    category: 'Lipid Panel',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 40, max: 60 } // Desirable >60
  },
  'ldl_cholesterol': {
    standardName: 'LDL Cholesterol',
    aliases: ['ldl cholesterol', 'ldl', 'ldl-c', 'low density lipoprotein', 'calculated ldl'], // Often calculated
    category: 'Lipid Panel',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 0, max: 100 } // Desirable <100
  },
  'triglycerides': {
    standardName: 'Triglycerides',
    aliases: ['triglycerides', 'trig', 'tg', 'trigs'],
    category: 'Lipid Panel',
    unit: ['mg/dL', 'mg/dl', 'mmol/L'],
    validRange: { min: 0, max: 150 } // Desirable <150
  },
  // THYROID FUNCTION
  'tsh': {
    standardName: 'Thyroid Stimulating Hormone',
    aliases: ['tsh', 'thyroid stimulating hormone', 'thyrotropin'],
    category: 'Thyroid Function',
    unit: ['µIU/mL', 'uIU/mL', 'mIU/L'],
    validRange: { min: 0.4, max: 4.5 }
  },
  'free_t4': {
    standardName: 'Free T4',
    aliases: ['free t4', 'ft4', 'free thyroxine', 'thyroxine free'],
    category: 'Thyroid Function',
    unit: ['ng/dL', 'ng/dl', 'pmol/L'],
    validRange: { min: 0.8, max: 1.8 }
  },
  'free_t3': {
    standardName: 'Free T3',
    aliases: ['free t3', 'ft3', 'free triiodothyronine', 'triiodothyronine free'],
    category: 'Thyroid Function',
    unit: ['pg/mL', 'pg/ml', 'pmol/L'],
    validRange: { min: 2.0, max: 4.4 }
  },
  // HEMATOLOGY - WBC DIFFERENTIAL (already have core CBC)
  'neutrophils': {
    standardName: 'Neutrophils',
    aliases: ['neutrophils', 'neut', 'polys', 'segs', 'absolute neutrophils', 'neut abs', 'neu'],
    category: 'Hematology',
    unit: ['%', 'K/uL', '10^3/µL', '10^9/L', '/µL', '/uL'],
    validRange: { min: 40, max: 75 } // Percentage
  },
  'lymphocytes': {
    standardName: 'Lymphocytes',
    aliases: ['lymphocytes', 'lymph', 'lymphs', 'absolute lymphocytes', 'lymph abs', 'lym'],
    category: 'Hematology',
    unit: ['%', 'K/uL', '10^3/µL', '10^9/L', '/µL', '/uL'],
    validRange: { min: 20, max: 45 } // Percentage
  },
  'monocytes': {
    standardName: 'Monocytes',
    aliases: ['monocytes', 'mono', 'monos', 'absolute monocytes', 'mono abs'],
    category: 'Hematology',
    unit: ['%', 'K/uL', '10^3/µL', '10^9/L', '/µL', '/uL'],
    validRange: { min: 2, max: 10 } // Percentage
  },
  'eosinophils': {
    standardName: 'Eosinophils',
    aliases: ['eosinophils', 'eos', 'eosins', 'absolute eosinophils', 'eos abs'],
    category: 'Hematology',
    unit: ['%', 'K/uL', '10^3/µL', '10^9/L', '/µL', '/uL'],
    validRange: { min: 0, max: 6 } // Percentage
  },
  'basophils': {
    standardName: 'Basophils',
    aliases: ['basophils', 'baso', 'basos', 'absolute basophils', 'baso abs'],
    category: 'Hematology',
    unit: ['%', 'K/uL', '10^3/µL', '10^9/L', '/µL', '/uL'],
    validRange: { min: 0, max: 2 } // Percentage
  },
  'rdw': {
    standardName: 'Red Cell Distribution Width',
    aliases: ['rdw', 'rdw-cv', 'rdw-sd'],
    category: 'Hematology',
    unit: ['%', 'fL'],
    validRange: { min: 11.5, max: 14.5 } // RDW-CV (%)
  },
  'mpv': {
    standardName: 'Mean Platelet Volume',
    aliases: ['mpv', 'mean platelet vol'],
    category: 'Hematology',
    unit: ['fL', 'fl'],
    validRange: { min: 7.5, max: 11.5 }
  },
  // Add more biomarkers as needed...
};

// Helper function to normalize biomarker names
export function normalizeBiomarkerName(name: string): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')         // Replace multiple spaces with single space
    .trim();
}

// Helper function to find biomarker definition by name or alias
export function findBiomarkerDefinition(name: string): BiomarkerDefinition | undefined {
  const normalized = normalizeBiomarkerName(name); // e.g., "um"
  
  // 1. Try direct match on standard name or full alias
  const directMatch = Object.values(BIOMARKER_DICTIONARY).find(
    def => def.standardName.toLowerCase() === normalized || 
           def.aliases.some(alias => normalizeBiomarkerName(alias) === normalized) // Match normalized alias
  );
  if (directMatch) return directMatch;
  
  // 2. Try if normalized name CONTAINS a standard name or an alias (more specific)
  //    e.g., normalized="sodium chloride", alias="sodium" -> match
  //    e.g., normalized="potassium k", standardName="potassium" -> match
  const containsMatch = Object.values(BIOMARKER_DICTIONARY).find(def => {
    const lowerStandardName = def.standardName.toLowerCase();
    // Ensure the standard name is not too short and is actually part of the normalized name
    if (lowerStandardName.length > 2 && normalized.includes(lowerStandardName)) return true; 
    return def.aliases.some(alias => {
      const normalizedAlias = normalizeBiomarkerName(alias);
      // Ensure the alias is not too short to avoid spurious matches, and is actually part of the normalized name
      return normalizedAlias.length > 2 && normalized.includes(normalizedAlias); 
    });
  });
  if (containsMatch) return containsMatch;

  // 3. Fallback: Try if a standard name or alias CONTAINS the normalized name (less specific, original problematic logic)
  //    Only if normalized name is reasonably long to avoid "a" matching "sodium".
  //    e.g., normalized="calc", standardName="calcium" -> match
  if (normalized.length > 2) { // Only attempt this if normalized name is somewhat specific
    const includedInMatch = Object.values(BIOMARKER_DICTIONARY).find(def => {
      const lowerStandardName = def.standardName.toLowerCase();
      if (lowerStandardName.includes(normalized)) return true;
      return def.aliases.some(alias => {
        const normalizedAlias = normalizeBiomarkerName(alias);
        return normalizedAlias.includes(normalized);
      });
    });
    if (includedInMatch) return includedInMatch;
  }
  
  return undefined;
}

// Function to validate a biomarker value against its definition
export function validateBiomarkerValue(
  biomarker: Pick<ExtractedBiomarker, 'name' | 'value' | 'unit'>
): { valid: boolean; status?: 'low' | 'normal' | 'high' | 'critical'; message?: string } {
  const definition = findBiomarkerDefinition(biomarker.name);
  
  if (!definition) {
    return { 
      valid: false, 
      message: `No definition found for biomarker: ${biomarker.name}` 
    };
  }
  
  // Check if unit is valid
  if (biomarker.unit && !definition.unit.includes(biomarker.unit)) {
    return { 
      valid: false, 
      message: `Invalid unit '${biomarker.unit}' for ${biomarker.name}. Expected one of: ${definition.unit.join(', ')}` 
    };
  }
  
  const { value } = biomarker;
  const { validRange, criticalLow, criticalHigh } = definition;
  
  // Check critical low
  if (criticalLow !== undefined && value <= criticalLow) {
    return { valid: false, status: 'critical', message: 'Critical low value' };
  }
  
  // Check critical high
  if (criticalHigh !== undefined && value >= criticalHigh) {
    return { valid: false, status: 'critical', message: 'Critical high value' };
  }
  
  // Check normal range
  if (value < validRange.min) {
    return { valid: true, status: 'low', message: 'Below reference range' };
  }
  
  if (value > validRange.max) {
    return { valid: true, status: 'high', message: 'Above reference range' };
  }
  
  return { valid: true, status: 'normal' };
}
