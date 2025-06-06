/**
 * Pricing calculations for medical claims
 */

export interface PricingRule {
  cptCode: string;
  basePrice: number;
  medicareRate?: number;
  commercialRate?: number;
}

/**
 * Calculate charges for claim lines based on CPT codes
 */
export function calculateCharges(cptCodes: string[], pricingRules?: PricingRule[]): {
  cptCode: string;
  charge: number;
}[] {
  // Default pricing for common lab tests
  const defaultPricing: Record<string, number> = {
    // Panels
    "80048": 35.00,  // Basic metabolic panel
    "80050": 150.00, // General health panel
    "80053": 45.00,  // Comprehensive metabolic panel
    "80061": 40.00,  // Lipid panel
    
    // Individual chemistry tests
    "82247": 15.00,  // Bilirubin
    "82310": 12.00,  // Calcium
    "82374": 10.00,  // CO2
    "82435": 10.00,  // Chloride
    "82465": 15.00,  // Cholesterol
    "82565": 12.00,  // Creatinine
    "82947": 10.00,  // Glucose
    "83718": 20.00,  // HDL
    "83721": 20.00,  // LDL
    "84075": 15.00,  // Alkaline phosphatase
    "84132": 10.00,  // Potassium
    "84155": 12.00,  // Total protein
    "84295": 10.00,  // Sodium
    "84443": 35.00,  // TSH
    "84450": 15.00,  // AST
    "84460": 15.00,  // ALT
    "84478": 15.00,  // Triglycerides
    "84520": 12.00,  // BUN
    
    // Hematology
    "85025": 25.00,  // CBC with differential
    "85014": 8.00,   // Hematocrit
    "85018": 8.00,   // Hemoglobin
    "85041": 8.00,   // RBC count
    "85048": 8.00,   // WBC count
    "85049": 8.00,   // Platelet count
    
    // Thyroid tests
    "84436": 25.00,  // T4
    "84439": 30.00,  // Free T4
    "84480": 25.00,  // T3
    "84481": 30.00,  // Free T3
    
    // Molecular/Genetic
    "81214": 2500.00, // BRCA1
    "81216": 2500.00, // BRCA2
    "81479": 500.00,  // Unlisted molecular pathology
    "87635": 100.00,  // COVID-19 PCR
    "87804": 35.00,   // Flu rapid
    "87880": 25.00,   // Strep rapid
    
    // Special panels
    "81507": 349.00,  // Foresight carrier screen
    "0016U": 1950.00, // Oncotype DX
    "0017U": 3500.00, // FoundationOne CDx
  };

  const charges: { cptCode: string; charge: number }[] = [];

  cptCodes.forEach(code => {
    let charge = defaultPricing[code] || 50.00; // Default charge if not found

    // Check if custom pricing rules provided
    if (pricingRules) {
      const customRule = pricingRules.find(rule => rule.cptCode === code);
      if (customRule) {
        charge = customRule.basePrice;
      }
    }

    charges.push({ cptCode: code, charge });
  });

  return charges;
}

/**
 * Calculate total charge for a claim
 */
export function calculateTotalCharge(claimLines: { charge: number; units?: number }[]): number {
  return claimLines.reduce((total, line) => {
    const units = line.units || 1;
    return total + (line.charge * units);
  }, 0);
}

/**
 * Apply insurance adjustments
 */
export function applyInsuranceAdjustment(
  charge: number,
  insuranceType: string,
  contractRate?: number
): {
  allowedAmount: number;
  patientResponsibility: number;
  insurancePayment: number;
} {
  // Default contract rates by insurance type
  const defaultRates: Record<string, number> = {
    "MEDICARE": 0.65,
    "MEDICAID": 0.55,
    "COMMERCIAL": 0.80,
    "PPO": 0.75,
    "HMO": 0.70,
    "SELF_PAY": 1.00,
  };

  const rate = contractRate || defaultRates[insuranceType.toUpperCase()] || 0.80;
  const allowedAmount = charge * rate;

  // Assume 20% coinsurance for patient
  const patientCoinsurance = 0.20;
  const patientResponsibility = allowedAmount * patientCoinsurance;
  const insurancePayment = allowedAmount - patientResponsibility;

  return {
    allowedAmount,
    patientResponsibility,
    insurancePayment,
  };
}

/**
 * Calculate bundled pricing for panel tests
 */
export function calculateBundledPrice(cptCodes: string[]): {
  bundledCodes: string[];
  unbundledCodes: string[];
  totalCharge: number;
} {
  // Define bundles - if all components present, use panel code instead
  const bundles = [
    {
      panelCode: "80053",
      panelPrice: 45.00,
      components: ["82947", "84520", "82565", "84295", "84132", "82435", "82374", "82310"],
    },
    {
      panelCode: "80048",
      panelPrice: 35.00,
      components: ["82947", "84520", "82565", "84295", "84132", "82435", "82374"],
    },
    {
      panelCode: "80061",
      panelPrice: 40.00,
      components: ["82465", "83718", "83721", "84478"],
    },
  ];

  const bundledCodes: string[] = [];
  const unbundledCodes: string[] = [...cptCodes];
  let totalCharge = 0;

  // Check for bundles
  bundles.forEach(bundle => {
    const hasAllComponents = bundle.components.every(comp => 
      unbundledCodes.includes(comp)
    );

    if (hasAllComponents) {
      // Remove component codes and add panel code
      bundle.components.forEach(comp => {
        const index = unbundledCodes.indexOf(comp);
        if (index > -1) {
          unbundledCodes.splice(index, 1);
        }
      });
      bundledCodes.push(bundle.panelCode);
      totalCharge += bundle.panelPrice;
    }
  });

  // Calculate remaining unbundled charges
  const unbundledCharges = calculateCharges(unbundledCodes);
  totalCharge += unbundledCharges.reduce((sum, item) => sum + item.charge, 0);

  return {
    bundledCodes,
    unbundledCodes,
    totalCharge,
  };
}
