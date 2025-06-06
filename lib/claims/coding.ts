/**
 * CPT Code generation and management for claims processing
 */

export interface CPTCode {
  code: string;
  description: string;
  category: string;
  basePrice?: number;
}

/**
 * Generate appropriate CPT codes based on report type and tests performed
 */
export function generateCPTCodes(reportData: {
  type: string;
  tests?: string[];
  parsedData?: any;
}): string[] {
  const cptCodes: string[] = [];

  // Common lab test CPT codes
  const labTestCPTMap: Record<string, string> = {
    // Comprehensive Metabolic Panel
    "CMP": "80053",
    "COMPREHENSIVE_METABOLIC": "80053",
    
    // Basic Metabolic Panel
    "BMP": "80048",
    "BASIC_METABOLIC": "80048",
    
    // Complete Blood Count
    "CBC": "85025",
    "CBC_WITH_DIFF": "85025",
    
    // Lipid Panel
    "LIPID": "80061",
    "LIPID_PANEL": "80061",
    
    // Thyroid tests
    "TSH": "84443",
    "T3": "84480",
    "T4": "84436",
    "FREE_T3": "84481",
    "FREE_T4": "84439",
    
    // Individual tests
    "GLUCOSE": "82947",
    "CREATININE": "82565",
    "BUN": "84520",
    "SODIUM": "84295",
    "POTASSIUM": "84132",
    "CHLORIDE": "82435",
    "CO2": "82374",
    "CALCIUM": "82310",
    "ALBUMIN": "82040",
    "TOTAL_PROTEIN": "84155",
    "ALT": "84460",
    "AST": "84450",
    "ALP": "84075",
    "BILIRUBIN": "82247",
    
    // Cholesterol components
    "CHOLESTEROL": "82465",
    "HDL": "83718",
    "LDL": "83721",
    "TRIGLYCERIDES": "84478",
    
    // Hematology
    "HEMOGLOBIN": "85018",
    "HEMATOCRIT": "85014",
    "WBC": "85048",
    "PLATELET": "85049",
    "RBC": "85041",
    
    // Genetic tests
    "BRCA1": "81214",
    "BRCA2": "81216",
    "GENETIC_PANEL": "81479",
    
    // Molecular pathology
    "COVID_PCR": "87635",
    "STREP_RAPID": "87880",
    "FLU_RAPID": "87804",
  };

  // Parse report type
  const reportType = reportData.type?.toUpperCase() || "";

  // Check for panel tests first
  if (reportType.includes("COMPREHENSIVE") && reportType.includes("METABOLIC")) {
    cptCodes.push("80053");
  } else if (reportType.includes("BASIC") && reportType.includes("METABOLIC")) {
    cptCodes.push("80048");
  } else if (reportType.includes("LIPID")) {
    cptCodes.push("80061");
  } else if (reportType.includes("CBC")) {
    cptCodes.push("85025");
  }

  // Add individual test codes if tests are specified
  if (reportData.tests && Array.isArray(reportData.tests)) {
    reportData.tests.forEach(test => {
      const testUpper = test.toUpperCase().replace(/\s+/g, "_");
      if (labTestCPTMap[testUpper] && !cptCodes.includes(labTestCPTMap[testUpper])) {
        cptCodes.push(labTestCPTMap[testUpper]);
      }
    });
  }

  // Parse from parsedData if available
  if (reportData.parsedData) {
    try {
      const parsed = typeof reportData.parsedData === 'string' 
        ? JSON.parse(reportData.parsedData) 
        : reportData.parsedData;

      if (parsed.biomarkers && Array.isArray(parsed.biomarkers)) {
        parsed.biomarkers.forEach((biomarker: any) => {
          const biomarkerName = biomarker.name?.toUpperCase().replace(/\s+/g, "_");
          if (labTestCPTMap[biomarkerName] && !cptCodes.includes(labTestCPTMap[biomarkerName])) {
            cptCodes.push(labTestCPTMap[biomarkerName]);
          }
        });
      }
    } catch (error) {
      console.error("Error parsing report data:", error);
    }
  }

  // If no specific codes found, add a general lab test code
  if (cptCodes.length === 0) {
    cptCodes.push("80050"); // General health panel
  }

  return cptCodes;
}

/**
 * Validate CPT codes
 */
export function validateCPTCode(code: string): boolean {
  // Basic validation - CPT codes are 5 digits
  return /^\d{5}$/.test(code);
}

/**
 * Get CPT code description
 */
export function getCPTDescription(code: string): string {
  const descriptions: Record<string, string> = {
    "80048": "Basic metabolic panel",
    "80050": "General health panel",
    "80053": "Comprehensive metabolic panel",
    "80061": "Lipid panel",
    "82247": "Bilirubin; total",
    "82310": "Calcium; total",
    "82374": "Carbon dioxide (bicarbonate)",
    "82435": "Chloride; blood",
    "82465": "Cholesterol, serum, total",
    "82565": "Creatinine; blood",
    "82947": "Glucose; quantitative, blood",
    "83718": "Lipoprotein, direct measurement; high density cholesterol",
    "83721": "Lipoprotein, direct measurement; LDL cholesterol",
    "84075": "Phosphatase, alkaline",
    "84132": "Potassium; serum, plasma or whole blood",
    "84155": "Protein, total, except by refractometry",
    "84295": "Sodium; serum, plasma or whole blood",
    "84443": "Thyroid stimulating hormone (TSH)",
    "84450": "Transferase; aspartate amino (AST)",
    "84460": "Transferase; alanine amino (ALT)",
    "84478": "Triglycerides",
    "84520": "Urea nitrogen; quantitative",
    "85025": "Blood count; complete (CBC)",
    "85014": "Blood count; hematocrit",
    "85018": "Blood count; hemoglobin",
    "85041": "Blood count; red blood cell (RBC)",
    "85048": "Blood count; leukocyte (WBC)",
    "85049": "Blood count; platelet",
    "87635": "COVID-19, amplified probe technique",
    "87804": "Influenza virus, rapid test",
    "87880": "Streptococcus, group A, rapid test",
  };

  return descriptions[code] || "Laboratory test";
}
