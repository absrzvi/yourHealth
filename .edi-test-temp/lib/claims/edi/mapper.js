"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapClaimToEDIClaim = mapClaimToEDIClaim;
exports.extractProviderInfo = extractProviderInfo;
exports.extractSubscriberInfo = extractSubscriberInfo;
exports.extractDiagnosisCodes = extractDiagnosisCodes;
exports.generateControlNumber = generateControlNumber;
/**
 * Maps a standard Claim object to an EDI-compatible claim format
 * Enhances the basic claim with additional EDI-specific fields
 */
function mapClaimToEDIClaim(claim) {
    // Start with the base claim properties
    const ediClaim = {
        ...claim,
        claimLines: [], // Will be populated with enhanced claim lines
        placeOfService: "11", // Default to office/outpatient setting
        // Additional EDI fields with default values
        claimFrequencyCode: "1", // Original claim
        acceptAssignment: true,
        benefitsAssignmentCertificationIndicator: true,
        releaseOfInformationCode: "Y", // Patient consent on file
    };
    // Map claim lines to EDI-enhanced claim lines
    ediClaim.claimLines = claim.claimLines.map((line, index) => {
        // Create default diagnosis code pointers based on line number
        // In a real system, these would come from actual relationships between
        // procedures and diagnoses
        const diagnosisCodePointers = [1]; // Default to first diagnosis code
        // Convert to EDI claim line with enhanced properties
        const ediLine = {
            ...line,
            serviceStartDate: line.serviceDate, // Same as serviceDate initially
            placeOfService: ediClaim.placeOfService, // Inherit from claim
            diagnosisCodePointers,
            // Extract rendering provider NPI if present
            // In a real system, you would look up the provider details in a directory
            renderingProviderFirstName: line.renderingProviderNpi ? "RENDERING" : undefined,
            renderingProviderLastName: line.renderingProviderNpi ? "PROVIDER" : undefined,
        };
        return ediLine;
    });
    return ediClaim;
}
/**
 * Extract provider information from user data and claim
 * In a real system, this would pull from provider profiles or directories
 */
function extractProviderInfo(claim) {
    // In a real system, this would extract from provider profiles
    // For now, just return default placeholder values
    return {
        billingProviderNpi: "1234567890", // Default NPI
        billingProviderName: "FOR YOUR HEALTH MEDICAL GROUP",
        billingProviderTaxId: "123456789",
        billingProviderTaxIdType: "EIN"
    };
}
/**
 * Extracts subscriber (patient/insured) information from claim and user data
 */
function extractSubscriberInfo(claim) {
    // Extract from insurance plan
    const groupNumber = claim.insurancePlan.groupNumber || undefined;
    // In a real system, you would have complete patient demographics
    // This is a simplified version with placeholders
    return {
        subscriberId: claim.insurancePlan.memberId,
        subscriberLastName: claim.user.name?.split(' ')[1] || "DOE",
        subscriberFirstName: claim.user.name?.split(' ')[0] || "JANE",
        relationToInsured: "self", // Default to self
        groupNumber
    };
}
/**
 * Maps diagnosis codes from a claim to an array of formatted ICD-10 codes
 */
function extractDiagnosisCodes(claim) {
    // Collect all unique ICD-10 codes from claim lines
    const allCodes = new Set();
    claim.claimLines.forEach(line => {
        if (Array.isArray(line.icd10Codes)) {
            line.icd10Codes.forEach(code => {
                if (typeof code === 'string') {
                    // Remove any periods to match EDI format
                    const formattedCode = code.replace('.', '');
                    allCodes.add(formattedCode);
                }
            });
        }
    });
    // Convert Set to Array for return
    return Array.from(allCodes);
}
/**
 * Generates a control number for EDI transactions
 * Using a timestamp-based approach for uniqueness
 */
function generateControlNumber() {
    const now = new Date();
    // Format: YYYYMMDDHHMMSS + 3 random digits
    const timestamp = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return timestamp + random;
}
