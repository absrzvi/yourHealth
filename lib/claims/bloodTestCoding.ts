/**
 * Specialized CPT code generation for blood tests
 * This module provides more accurate CPT code generation for blood tests
 * by analyzing biomarker patterns and test panels
 */

import { BIOMARKER_DICTIONARY } from "../parsers/biomarkerDictionary";
import { logger } from "@/lib/logger";
import { Biomarker } from "@prisma/client";

interface CPTCode {
  code: string;
  description: string;
  charge: number;
}

// Define blood test panel types
export enum BloodTestPanel {
  BASIC_METABOLIC = "BASIC_METABOLIC",
  COMPREHENSIVE_METABOLIC = "COMPREHENSIVE_METABOLIC",
  COMPLETE_BLOOD_COUNT = "COMPLETE_BLOOD_COUNT",
  LIPID_PANEL = "LIPID_PANEL",
  LIVER_FUNCTION = "LIVER_FUNCTION",
  THYROID_PANEL = "THYROID_PANEL",
  HEMOGLOBIN_A1C = "HEMOGLOBIN_A1C",
  IRON_PANEL = "IRON_PANEL",
  VITAMIN_D = "VITAMIN_D",
  GENERAL_HEALTH = "GENERAL_HEALTH",
}

// Define panel requirements (minimum biomarkers needed to qualify for a panel)
interface PanelDefinition {
  cptCode: string;
  description: string;
  requiredBiomarkers: string[];
  minimumRequired: number; // Minimum number of required biomarkers needed
}

// Define panel definitions with required biomarkers and CPT codes
const PANEL_DEFINITIONS: Record<BloodTestPanel, PanelDefinition> = {
  [BloodTestPanel.BASIC_METABOLIC]: {
    cptCode: "80048",
    description: "Basic Metabolic Panel",
    requiredBiomarkers: [
      "Glucose", "Calcium", "Sodium", "Potassium", 
      "Chloride", "Carbon Dioxide", "Creatinine", "Blood Urea Nitrogen"
    ],
    minimumRequired: 6, // At least 6 of the 8 biomarkers
  },
  [BloodTestPanel.COMPREHENSIVE_METABOLIC]: {
    cptCode: "80053",
    description: "Comprehensive Metabolic Panel",
    requiredBiomarkers: [
      "Glucose", "Calcium", "Albumin", "Total Protein", "Sodium", "Potassium", 
      "Chloride", "Carbon Dioxide", "Blood Urea Nitrogen", "Creatinine", 
      "Alkaline Phosphatase", "Alanine Aminotransferase", "Aspartate Aminotransferase", 
      "Bilirubin"
    ],
    minimumRequired: 10, // At least 10 of the 14 biomarkers
  },
  [BloodTestPanel.COMPLETE_BLOOD_COUNT]: {
    cptCode: "85025", // With differential
    description: "Complete Blood Count with Differential",
    requiredBiomarkers: [
      "Hemoglobin", "Hematocrit", "RBC Count", "WBC Count", "Platelet Count",
      "Neutrophils", "Lymphocytes", "Monocytes", "Eosinophils", "Basophils",
      "MCV", "MCH", "MCHC", "RDW"
    ],
    minimumRequired: 8, // At least 8 of the 14 biomarkers
  },
  [BloodTestPanel.LIPID_PANEL]: {
    cptCode: "80061",
    description: "Lipid Panel",
    requiredBiomarkers: [
      "Total Cholesterol", "HDL Cholesterol", "LDL Cholesterol", "Triglycerides"
    ],
    minimumRequired: 3, // At least 3 of the 4 biomarkers
  },
  [BloodTestPanel.LIVER_FUNCTION]: {
    cptCode: "80076",
    description: "Hepatic Function Panel",
    requiredBiomarkers: [
      "Albumin", "Total Protein", "Bilirubin", "Alkaline Phosphatase",
      "Alanine Aminotransferase", "Aspartate Aminotransferase"
    ],
    minimumRequired: 4, // At least 4 of the 6 biomarkers
  },
  [BloodTestPanel.THYROID_PANEL]: {
    cptCode: "80055",
    description: "Thyroid Panel",
    requiredBiomarkers: ["TSH", "Free T4", "Free T3", "T4", "T3"],
    minimumRequired: 2, // At least 2 of the 5 biomarkers
  },
  [BloodTestPanel.HEMOGLOBIN_A1C]: {
    cptCode: "83036",
    description: "Hemoglobin A1C",
    requiredBiomarkers: ["Hemoglobin A1C", "HbA1c", "Glycated Hemoglobin"],
    minimumRequired: 1, // Only need one of these
  },
  [BloodTestPanel.IRON_PANEL]: {
    cptCode: "83550",
    description: "Iron Panel",
    requiredBiomarkers: ["Iron", "TIBC", "Ferritin", "Transferrin", "Transferrin Saturation"],
    minimumRequired: 2, // At least 2 of the 5 biomarkers
  },
  [BloodTestPanel.VITAMIN_D]: {
    cptCode: "82306",
    description: "Vitamin D, 25-Hydroxy",
    requiredBiomarkers: ["Vitamin D", "25-OH Vitamin D", "25-Hydroxyvitamin D"],
    minimumRequired: 1, // Only need one of these
  },
  [BloodTestPanel.GENERAL_HEALTH]: {
    cptCode: "80050",
    description: "General Health Panel",
    requiredBiomarkers: [], // This is a fallback panel
    minimumRequired: 0,
  },
};

// Individual biomarker CPT codes
const INDIVIDUAL_BIOMARKER_CODES: Record<string, { code: string, description: string }> = {
  "Glucose": { code: "82947", description: "Glucose; quantitative, blood" },
  "Creatinine": { code: "82565", description: "Creatinine; blood" },
  "Blood Urea Nitrogen": { code: "84520", description: "Urea nitrogen; quantitative" },
  "Sodium": { code: "84295", description: "Sodium; serum, plasma or whole blood" },
  "Potassium": { code: "84132", description: "Potassium; serum, plasma or whole blood" },
  "Chloride": { code: "82435", description: "Chloride; blood" },
  "Carbon Dioxide": { code: "82374", description: "Carbon dioxide (bicarbonate)" },
  "Calcium": { code: "82310", description: "Calcium; total" },
  "Albumin": { code: "82040", description: "Albumin; serum, plasma or whole blood" },
  "Total Protein": { code: "84155", description: "Protein, total, except by refractometry" },
  "Alanine Aminotransferase": { code: "84460", description: "Transferase; alanine amino (ALT)" },
  "Aspartate Aminotransferase": { code: "84450", description: "Transferase; aspartate amino (AST)" },
  "Alkaline Phosphatase": { code: "84075", description: "Phosphatase, alkaline" },
  "Bilirubin": { code: "82247", description: "Bilirubin; total" },
  "Total Cholesterol": { code: "82465", description: "Cholesterol, serum, total" },
  "HDL Cholesterol": { code: "83718", description: "Lipoprotein, direct measurement; high density cholesterol" },
  "LDL Cholesterol": { code: "83721", description: "Lipoprotein, direct measurement; LDL cholesterol" },
  "Triglycerides": { code: "84478", description: "Triglycerides" },
  "Hemoglobin": { code: "85018", description: "Blood count; hemoglobin" },
  "Hematocrit": { code: "85014", description: "Blood count; hematocrit" },
  "RBC Count": { code: "85041", description: "Blood count; red blood cell (RBC)" },
  "WBC Count": { code: "85048", description: "Blood count; leukocyte (WBC)" },
  "Platelet Count": { code: "85049", description: "Blood count; platelet" },
  "TSH": { code: "84443", description: "Thyroid stimulating hormone (TSH)" },
  "Free T4": { code: "84439", description: "Thyroxine; free" },
  "Free T3": { code: "84481", description: "Triiodothyronine T3; free" },
  "T4": { code: "84436", description: "Thyroxine; total" },
  "T3": { code: "84480", description: "Triiodothyronine T3; total" },
  "Hemoglobin A1C": { code: "83036", description: "Hemoglobin; glycosylated (A1C)" },
  "Iron": { code: "83540", description: "Iron" },
  "Ferritin": { code: "82728", description: "Ferritin" },
  "Vitamin D": { code: "82306", description: "Vitamin D; 25 hydroxy" },
  "Vitamin B12": { code: "82607", description: "Cyanocobalamin (Vitamin B-12)" },
  "Folate": { code: "82746", description: "Folic acid; serum" },
};

/**
 * Identifies blood test panels based on biomarkers present
 * @param biomarkers Array of biomarker names
 * @returns Array of identified panel types
 */
export function identifyBloodTestPanels(biomarkers: string[]): BloodTestPanel[] {
  const standardizedBiomarkers = biomarkers.map(name => {
    // Try to find the standardized name from the dictionary
    const definition = Object.values(BIOMARKER_DICTIONARY).find(def => 
      def.standardName.toLowerCase() === name.toLowerCase() ||
      def.aliases.some(alias => alias.toLowerCase() === name.toLowerCase())
    );
    return definition ? definition.standardName : name;
  });

  // Check each panel to see if it matches
  const matchedPanels: BloodTestPanel[] = [];
  
  for (const [panelType, definition] of Object.entries(PANEL_DEFINITIONS)) {
    // Skip the general health panel as it's a fallback
    if (panelType === BloodTestPanel.GENERAL_HEALTH) continue;
    
    // Count how many required biomarkers are present
    const matchCount = definition.requiredBiomarkers.filter(required => 
      standardizedBiomarkers.some(biomarker => 
        biomarker.toLowerCase() === required.toLowerCase()
      )
    ).length;
    
    // If we have enough matches, add this panel
    if (matchCount >= definition.minimumRequired) {
      matchedPanels.push(panelType as BloodTestPanel);
    }
  }
  
  // If no specific panels matched, add the general health panel
  if (matchedPanels.length === 0) {
    matchedPanels.push(BloodTestPanel.GENERAL_HEALTH);
  }
  
  return matchedPanels;
}

/**
 * Generates CPT codes for blood tests based on biomarkers
 * @param biomarkers Array of biomarker objects or names
 * @returns Array of CPT code objects with code, description, and diagnoses
 */
export function generateBloodTestCPTCodes(biomarkers: (Biomarker | string)[]): CPTCode[] {
  // Default charge for individual tests
  const DEFAULT_INDIVIDUAL_CHARGE = 49.99;
  
  try {
    // Default charges for different panel types
    const PANEL_CHARGES: Record<string, number> = {
      '80048': 45.00,  // Basic Metabolic Panel
      '80053': 65.00,  // Comprehensive Metabolic Panel
      '85025': 35.00,  // Complete Blood Count with Differential
      '80061': 55.00,  // Lipid Panel
      '80076': 75.00,  // Hepatic Function Panel
      '80055': 85.00,  // Thyroid Panel
      '83036': 65.00,  // Hemoglobin A1C
      '83550': 95.00,  // Iron Panel
      '82306': 75.00,  // Vitamin D
      '80050': 150.00, // General Health Panel
    };

    // Extract biomarker names
    const biomarkerNames = biomarkers.map(b => 
      typeof b === 'string' ? b : b.name
    );
    
    // Identify panels
    const panels = identifyBloodTestPanels(biomarkerNames);
    
    // Get CPT codes for panels with charges
    const panelCodes = panels.map(panel => {
      const panelDef = PANEL_DEFINITIONS[panel];
      return {
        code: panelDef.cptCode,
        description: panelDef.description,
        charge: PANEL_CHARGES[panelDef.cptCode] || 75.00 // Default charge if not found
      };
    });
    
    // Get individual CPT codes for biomarkers not covered by panels
    const individualCodes = biomarkerNames
      .filter(name => {
        // Skip if this biomarker is covered by any panel
        return !panels.some(panel => 
          PANEL_DEFINITIONS[panel].requiredBiomarkers.includes(name)
        );
      })
      .map(name => {
        // Find standard name from dictionary
        const standardName = Object.keys(BIOMARKER_DICTIONARY).find(key => 
          key.toLowerCase() === name.toLowerCase() || 
          BIOMARKER_DICTIONARY[key as keyof typeof BIOMARKER_DICTIONARY].aliases
            .some((alias: string) => alias.toLowerCase() === name.toLowerCase())
        );
        
        if (standardName && INDIVIDUAL_BIOMARKER_CODES[standardName as keyof typeof INDIVIDUAL_BIOMARKER_CODES]) {
          return {
            code: INDIVIDUAL_BIOMARKER_CODES[standardName as keyof typeof INDIVIDUAL_BIOMARKER_CODES].code,
            description: INDIVIDUAL_BIOMARKER_CODES[standardName as keyof typeof INDIVIDUAL_BIOMARKER_CODES].description,
            charge: DEFAULT_INDIVIDUAL_CHARGE
          };
        }
        return null;
      })
      .filter((code): code is CPTCode => code !== null);
    
    // If no panels matched, return individual codes for all biomarkers with default charge
    if (panelCodes.length === 0) {
      return individualCodes.map(code => ({
        ...code,
        charge: code.charge || DEFAULT_INDIVIDUAL_CHARGE
      }));
    }
    
    // Otherwise return combined panels and individual codes
    return [...panelCodes, ...individualCodes].map(code => ({
      ...code,
      charge: code.charge || DEFAULT_INDIVIDUAL_CHARGE
    }));
  } catch (error) {
    logger.error(`Error in generateBloodTestCPTCodes: ${error}`);
    // Return a default code in case of error
    return [{ code: "80050", description: "General Health Panel", charge: DEFAULT_INDIVIDUAL_CHARGE }];
  }
}

/**
 * Maps biomarker categories to ICD-10 diagnosis codes
 * @param biomarkers Array of biomarker objects
 * @returns Array of ICD-10 diagnosis codes
 */
export function mapBiomarkersToDiagnoses(biomarkers: Biomarker[]): string[] {
  // Group biomarkers by category
  const categories = new Set<string>();
  
  biomarkers.forEach(biomarker => {
    if (biomarker.category) {
      categories.add(biomarker.category);
    } else {
      // Try to find category from dictionary
      const definition = Object.values(BIOMARKER_DICTIONARY).find(def => 
        def.standardName.toLowerCase() === biomarker.name.toLowerCase() ||
        def.aliases.some(alias => alias.toLowerCase() === biomarker.name.toLowerCase())
      );
      
      if (definition) {
        categories.add(definition.category);
      }
    }
  });
  
  // Map categories to ICD-10 codes
  const diagnosisMap: Record<string, string[]> = {
    'hematology': ['D64.9', 'D75.9'],  // Anemia, unspecified; Blood disorder, unspecified
    'Hematology': ['D64.9', 'D75.9'],  // Anemia, unspecified; Blood disorder, unspecified
    'Liver Function': ['R74.8', 'K76.9'],  // Abnormal liver function, unspecified
    'Renal Function': ['N28.9', 'R94.4'],  // Renal disorder, unspecified
    'Electrolytes': ['E87.8'],  // Electrolyte imbalance
    'Lipid Panel': ['E78.5'],  // Hyperlipidemia, unspecified
    'Thyroid Function': ['E07.9'],  // Thyroid disorder, unspecified
    'Metabolic': ['E88.9'],  // Metabolic disorder, unspecified
    'vitamins': ['E56.9'],  // Vitamin deficiency, unspecified
    'diabetes': ['R73.09', 'E11.9'],  // Abnormal glucose, Type 2 diabetes
    'hormones': ['E34.9'],  // Endocrine disorder, unspecified
    'iron': ['D50.9'],  // Iron deficiency anemia, unspecified
  };
  
  // Generate diagnosis codes based on categories
  const diagnoses = Array.from(categories).flatMap(category => 
    diagnosisMap[category] || []
  );
  
  // Default diagnosis codes if no specific categories are found
  const defaultDiagnoses = ['Z00.00', 'Z13.9']; // General health check, unspecified screening
  
  // Use default diagnoses if none were found
  return diagnoses.length > 0 ? diagnoses : defaultDiagnoses;
}

/**
 * Checks if biomarkers indicate abnormal values that might require additional diagnosis codes
 * @param biomarkers Array of biomarker objects
 * @returns Additional ICD-10 codes for abnormal findings
 */
export function checkForAbnormalValues(biomarkers: Biomarker[]): string[] {
  const additionalCodes: string[] = [];
  
  // Count flagged biomarkers by category
  const flaggedCategories: Record<string, number> = {};
  
  biomarkers.forEach(biomarker => {
    if (biomarker.isFlagged) {
      const category = biomarker.category || 'unknown';
      flaggedCategories[category] = (flaggedCategories[category] || 0) + 1;
    }
  });
  
  // Add codes for categories with multiple abnormal values
  for (const [category, count] of Object.entries(flaggedCategories)) {
    if (count >= 2) {
      switch (category.toLowerCase()) {
        case 'liver function':
          additionalCodes.push('R94.5'); // Abnormal results of liver function studies
          break;
        case 'renal function':
          additionalCodes.push('R94.4'); // Abnormal results of kidney function studies
          break;
        case 'lipid panel':
          additionalCodes.push('E78.5'); // Hyperlipidemia, unspecified
          break;
        case 'hematology':
          additionalCodes.push('R70.9'); // Abnormal blood count, unspecified
          break;
        case 'thyroid function':
          additionalCodes.push('R94.6'); // Abnormal results of thyroid function studies
          break;
        case 'metabolic':
          additionalCodes.push('R79.9'); // Abnormal finding of blood chemistry, unspecified
          break;
      }
    }
  }
  
  return additionalCodes;
}
