/**
 * Manual test script for CPT code generation
 * 
 * This script tests the core CPT code generation logic with a self-contained implementation
 * to help verify the algorithm is working correctly without external dependencies.
 */

// Define our own simplified biomarker dictionary for testing
const BIOMARKER_DICTIONARY = {
  'glucose': {
    standardName: 'Glucose',
    aliases: ['Blood Glucose', 'Fasting Glucose', 'GLU'],
    category: 'Metabolic',
    unit: 'mg/dL',
    validRange: [70, 110]
  },
  'hemoglobin': {
    standardName: 'Hemoglobin',
    aliases: ['Hgb', 'Hb'],
    category: 'Hematology',
    unit: 'g/dL',
    validRange: [12, 18]
  },
  'alt': {
    standardName: 'ALT',
    aliases: ['Alanine Aminotransferase', 'SGPT'],
    category: 'Liver',
    unit: 'U/L',
    validRange: [7, 56]
  },
  'ast': {
    standardName: 'AST',
    aliases: ['Aspartate Aminotransferase', 'SGOT'],
    category: 'Liver',
    unit: 'U/L',
    validRange: [10, 40]
  },
  'cholesterol': {
    standardName: 'Total Cholesterol',
    aliases: ['Cholesterol', 'TC'],
    category: 'Lipids',
    unit: 'mg/dL',
    validRange: [125, 200]
  },
  'hdl': {
    standardName: 'HDL',
    aliases: ['HDL Cholesterol', 'High-Density Lipoprotein'],
    category: 'Lipids',
    unit: 'mg/dL',
    validRange: [40, 60]
  },
  'ldl': {
    standardName: 'LDL',
    aliases: ['LDL Cholesterol', 'Low-Density Lipoprotein'],
    category: 'Lipids',
    unit: 'mg/dL',
    validRange: [0, 100]
  },
  'triglycerides': {
    standardName: 'Triglycerides',
    aliases: ['TG', 'Trigs'],
    category: 'Lipids',
    unit: 'mg/dL',
    validRange: [0, 150]
  },
  'sodium': {
    standardName: 'Sodium',
    aliases: ['Na', 'Na+'],
    category: 'Electrolytes',
    unit: 'mmol/L',
    validRange: [135, 145]
  },
  'potassium': {
    standardName: 'Potassium',
    aliases: ['K', 'K+'],
    category: 'Electrolytes',
    unit: 'mmol/L',
    validRange: [3.5, 5.0]
  },
  'chloride': {
    standardName: 'Chloride',
    aliases: ['Cl', 'Cl-'],
    category: 'Electrolytes',
    unit: 'mmol/L',
    validRange: [98, 107]
  },
  'tsh': {
    standardName: 'TSH',
    aliases: ['Thyroid Stimulating Hormone', 'Thyrotropin'],
    category: 'Thyroid',
    unit: 'mIU/L',
    validRange: [0.4, 4.0]
  }
};

// Define our own simplified CPT code functions
function generateCPTCodes(reportData) {
  const cptCodes = [];
  
  // Common lab test CPT codes
  const labTestCPTMap = {
    "CMP": "80053",
    "BMP": "80048",
    "CBC": "85025",
    "LIPID": "80061",
    "TSH": "84443",
    "GLUCOSE": "82947",
    "HEMOGLOBIN": "85018",
    "ALT": "84460",
    "AST": "84450",
    "CHOLESTEROL": "82465",
    "HDL": "83718",
    "LDL": "83721",
    "TRIGLYCERIDES": "84478",
    "SODIUM": "84295",
    "POTASSIUM": "84132",
    "CHLORIDE": "82435"
  };
  
  // Check report type
  const reportType = reportData.type?.toUpperCase() || "";
  
  // Check for panel tests first
  if (reportType.includes("BLOOD")) {
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
          parsed.biomarkers.forEach((biomarker) => {
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
  }
  
  // If no specific codes found, add a general lab test code
  if (cptCodes.length === 0) {
    cptCodes.push("80050"); // General health panel
  }
  
  return cptCodes;
}

function validateCPTCode(code) {
  // Simple validation - check if it's a 5-digit number
  return /^\d{5}$/.test(code);
}

function getCPTDescription(code) {
  // Simple descriptions for common codes
  const descriptions = {
    "80053": "Comprehensive Metabolic Panel",
    "80048": "Basic Metabolic Panel",
    "85025": "Complete Blood Count with Differential",
    "80061": "Lipid Panel",
    "84443": "Thyroid Stimulating Hormone (TSH)",
    "82947": "Glucose",
    "85018": "Hemoglobin",
    "84460": "Alanine Aminotransferase (ALT)",
    "84450": "Aspartate Aminotransferase (AST)",
    "82465": "Total Cholesterol",
    "83718": "HDL Cholesterol",
    "83721": "LDL Cholesterol",
    "84478": "Triglycerides",
    "84295": "Sodium",
    "84132": "Potassium",
    "82435": "Chloride",
    "80050": "General Health Panel"
  };
  
  return descriptions[code] || `CPT Code ${code}`;
}

// Sample report data
const sampleReport = {
  id: 'test-report-id',
  type: 'BLOOD_TEST',
  parsedData: JSON.stringify({
    biomarkers: [
      { name: 'Glucose', value: 100, unit: 'mg/dL', category: 'Metabolic' },
      { name: 'Hemoglobin', value: 14, unit: 'g/dL', category: 'Hematology' },
      { name: 'ALT', value: 30, unit: 'U/L', category: 'Liver' },
      { name: 'AST', value: 35, unit: 'U/L', category: 'Liver' },
      { name: 'Total Cholesterol', value: 200, unit: 'mg/dL', category: 'Lipids' },
      { name: 'HDL', value: 50, unit: 'mg/dL', category: 'Lipids' },
      { name: 'LDL', value: 120, unit: 'mg/dL', category: 'Lipids' },
      { name: 'Triglycerides', value: 150, unit: 'mg/dL', category: 'Lipids' },
      { name: 'Sodium', value: 140, unit: 'mmol/L', category: 'Electrolytes' },
      { name: 'Potassium', value: 4.5, unit: 'mmol/L', category: 'Electrolytes' },
      { name: 'Chloride', value: 102, unit: 'mmol/L', category: 'Electrolytes' },
      { name: 'TSH', value: 2.5, unit: 'mIU/L', category: 'Thyroid' }
    ]
  })
};

// Simplified diagnosis mapping
const diagnosisMap = {
  'Hematology': ['D64.9', 'D75.9'],
  'Liver': ['R74.8', 'K76.9'],
  'Kidney': ['N28.9', 'R94.4'],
  'Electrolytes': ['E87.8'],
  'Lipids': ['E78.5'],
  'Thyroid': ['E07.9'],
  'Metabolic': ['E88.9'],
  'Vitamins': ['E56.9'],
  'Diabetes': ['R73.09', 'E11.9'],
  'Hormones': ['E34.9'],
  'Iron': ['D50.9'],
};

// Default diagnosis codes
const defaultDiagnoses = ['Z00.00', 'Z13.9']; // General health check, unspecified screening

/**
 * Manual test of CPT code generation
 */
function testCPTGeneration() {
  console.log('Starting manual CPT code generation test');
  
  try {
    // Parse the report data
    let parsedData = null;
    if (sampleReport.parsedData) {
      try {
        parsedData = JSON.parse(sampleReport.parsedData);
      } catch (e) {
        console.error('Error parsing report data:', e);
      }
    }
    
    // Extract biomarkers from parsed data
    const biomarkers = parsedData?.biomarkers || [];
    console.log(`Found ${biomarkers.length} biomarkers in report`);
    
    // Map biomarkers to categories
    const categories = new Set();
    biomarkers.forEach(biomarker => {
      if (biomarker.category) {
        categories.add(biomarker.category);
      }
    });
    
    console.log('Biomarker categories found:', Array.from(categories));
    
    // Generate CPT codes using the actual coding module
    const cptCodes = generateCPTCodes({
      type: sampleReport.type,
      tests: biomarkers.map(b => b.name),
      parsedData: parsedData
    });
    
    console.log('Generated CPT codes:', cptCodes);
    
    // Validate CPT codes
    cptCodes.forEach(code => {
      const isValid = validateCPTCode(code);
      console.log(`CPT code ${code} is ${isValid ? 'valid' : 'invalid'}`);
      console.log(`Description: ${getCPTDescription(code)}`);
    });
    
    // Generate diagnosis codes based on categories
    const diagnoses = Array.from(categories).flatMap(category => 
      diagnosisMap[category] || []
    );
    
    // Use default diagnoses if none were found
    const finalDiagnoses = diagnoses.length > 0 ? diagnoses : defaultDiagnoses;
    console.log('Diagnoses:', finalDiagnoses);
    
    // Create final CPT code objects
    const result = cptCodes.map(code => ({
      cpt: code,
      description: getCPTDescription(code),
      diagnoses: finalDiagnoses,
      units: 1
    }));
    
    console.log('\nFinal CPT code results:');
    result.forEach(r => {
      console.log(`CPT: ${r.cpt} - ${r.description}`);
      console.log(`Diagnoses: ${r.diagnoses.join(', ')}`);
      console.log('-----------------------------------');
    });
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testCPTGeneration();
