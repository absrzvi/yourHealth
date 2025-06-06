/**
 * Utility functions for EDI 837 generation
 */

/**
 * Format a date to EDI format (CCYYMMDD)
 * @param date Date to format
 */
export function formatEDIDate(date: Date | string | null): string {
  if (!date) {
    return formatEDIDate(new Date());
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Format a time to EDI format (HHMM)
 * @param date Date to extract time from
 */
export function formatEDITime(date: Date | string | null): string {
  if (!date) {
    return formatEDITime(new Date());
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toTimeString().slice(0, 5).replace(':', '');
}

/**
 * Left pad a string or number to the specified length
 * @param value Value to pad
 * @param length Target length
 * @param padChar Character to use for padding (default: '0')
 */
export function padLeft(value: string | number, length: number, padChar: string = '0'): string {
  return String(value).padStart(length, padChar);
}

/**
 * Right pad a string or number to the specified length
 * @param value Value to pad
 * @param length Target length
 * @param padChar Character to use for padding (default: ' ')
 */
export function padRight(value: string | number | null | undefined, length: number, padChar: string = ' '): string {
  if (value === null || value === undefined) {
    return padChar.repeat(length);
  }
  return String(value).padEnd(length, padChar);
}

/**
 * Parse a full name into firstName, lastName
 * @param fullName Full name to parse
 */
export function parseFullName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  if (!fullName) {
    return { firstName: '', lastName: '' };
  }
  
  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return { firstName: '', lastName: parts[0] };
  }
  
  const lastName = parts.pop() || '';
  const firstName = parts.join(' ');
  
  return { firstName, lastName };
}

/**
 * Extract first name, middle initial, and last name from a full name
 * @param fullName Full name to parse
 */
export function parsePersonName(fullName: string | null | undefined): {
  firstName: string;
  middleName: string;
  lastName: string;
} {
  if (!fullName) {
    return {
      firstName: "",
      middleName: "",
      lastName: ""
    };
  }

  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return {
      firstName: parts[0],
      middleName: "",
      lastName: ""
    };
  }
  
  if (parts.length === 2) {
    return {
      firstName: parts[0],
      middleName: "",
      lastName: parts[1]
    };
  }
  
  return {
    firstName: parts[0],
    middleName: parts[1].charAt(0),
    lastName: parts.slice(2).join(" ")
  };
}

/**
 * Format a name for EDI output, handling null values and truncation
 * @param name Name to format
 * @param maxLength Maximum allowed length (default: 35)
 */
export function formatEDIName(name: string | null | undefined, maxLength: number = 35): string {
  if (!name) return '';
  
  // Convert to uppercase and remove special characters except spaces
  return name.toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .slice(0, maxLength)
    .trim();
}

/**
 * Validate an NPI (National Provider Identifier)
 * @param npi NPI to validate
 */
export function validateNPI(npi: string | null | undefined): boolean {
  if (!npi) return false;
  
  // Basic validation - NPI should be 10 digits
  return /^\d{10}$/.test(npi);
}

/**
 * Advanced NPI validation with check digit
 * @param npi NPI to validate
 */
export function isValidNPI(npi: string | null | undefined): boolean {
  if (!npi) return false;
  
  // NPI must be 10 digits
  if (!/^\d{10}$/.test(npi)) return false;
  
  // NPI check digit validation
  const digits = npi.split("").map(Number);
  const checkDigit = digits.pop();
  
  // Double every other digit, starting from the right
  const alternateSum = digits.reverse()
    .map((digit, index) => {
      if (index % 2 === 0) {
        const doubled = digit * 2;
        return doubled > 9 ? doubled - 9 : doubled;
      }
      return digit;
    })
    .reduce((sum, num) => sum + num, 0);
  
  const calculatedCheckDigit = (10 - (alternateSum % 10)) % 10;
  
  return calculatedCheckDigit === checkDigit;
}

/**
 * Format a monetary amount for EDI
 * @param amount Amount to format
 */
export function formatEDIAmount(amount: number): string {
  // Format as dollars.cents with no decimal point
  return amount.toFixed(2).replace('.', '');
}

/**
 * Generate a control number for EDI transactions
 * Using a timestamp-based approach for uniqueness
 */
export function generateControlNumber(): string {
  const now = new Date();
  // Format: YYYYMMDDHHMMSS + 3 random digits
  const timestamp = 
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
    
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return timestamp + random;
}

/**
 * Validates format of diagnosis code (ICD-10)
 * @param code Diagnosis code to validate
 */
export function isValidICD10(code: string | null | undefined): boolean {
  if (!code) return false;
  
  // Basic ICD-10 format: Letter followed by 2 digits, optional decimal, and up to 4 more characters
  return /^[A-Z]\d{2}(\.\d{1,4})?$/.test(code);
}

/**
 * Validates format of procedure code (CPT/HCPCS)
 * @param code Procedure code to validate
 */
export function isValidProcedureCode(code: string | null | undefined): boolean {
  if (!code) return false;
  
  // CPT codes are 5 digits, HCPCS are 1 letter followed by 4 digits
  return /^(\d{5}|[A-Z]\d{4})$/.test(code);
}

/**
 * Create a standardized EDI filename
 * @param prefix File prefix
 * @param claimId Claim identifier
 */
export function createEDIFilename(prefix: string, claimId: string): string {
  const timestamp = formatEDIDate(new Date()) + formatEDITime(new Date());
  return `${prefix}_${timestamp}_${claimId}.edi`;
}
