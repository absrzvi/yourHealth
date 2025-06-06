// Manual test script to view EDI output
// This script uses the compiled TypeScript code to generate a sample EDI file
// and print it to the console for inspection

// Import required modules
const fs = require('fs');
const path = require('path');

// Path to EDI generator module
const generatorPath = './lib/claims/edi/generator';

// First we need to compile the TypeScript file to JavaScript
const { exec } = require('child_process');

console.log('Compiling TypeScript...');
exec('npx tsc lib/claims/edi/generator.ts --outDir .edi-test-temp --moduleResolution node --esModuleInterop true --target es2020 --module commonjs --skipLibCheck', (error) => {
  if (error) {
    console.error('Error compiling TypeScript:', error);
    return;
  }
  
  console.log('TypeScript compiled successfully. Generating EDI file...');
  
  try {
    // Create directory for temporary compiled files
    if (!fs.existsSync('./.edi-test-temp/lib/claims/edi')) {
      fs.mkdirSync('./.edi-test-temp/lib/claims/edi', { recursive: true });
    }
    
    // Copy utils.ts as compiled JS is needed
    exec('npx tsc lib/claims/edi/utils.ts --outDir .edi-test-temp --moduleResolution node --esModuleInterop true --target es2020 --module commonjs --skipLibCheck', () => {
      try {
        // Now try to import the compiled generator
        const { EDI837Generator } = require('./.edi-test-temp/lib/claims/edi/generator');
        
        // Create sample claim data
        const sampleClaim = {
          claimNumber: 'TEST12345',
          totalCharge: 500.75,
          user: {
            id: 'user123',
            name: 'John Smith',
            email: 'john@example.com'
          },
          insurancePlan: {
            memberId: 'MEM123456',
            groupNumber: 'GRP7890'
          },
          claimLines: [
            {
              procedureCode: '99213',
              charge: 250.50,
              units: 1,
              serviceDate: new Date(),
              icd10Codes: ['J02.9']
            },
            {
              procedureCode: '85025',
              charge: 125.25,
              units: 1,
              serviceDate: new Date(),
              icd10Codes: ['R50.9']
            }
          ]
        };
        
        // Generate EDI content
        console.log('Creating EDI generator...');
        const generator = new EDI837Generator();
        
        console.log('Generating EDI file...');
        const ediContent = generator.generateFromClaim(sampleClaim);
        
        // Save to file for inspection
        const outputPath = './edi-test-output.edi';
        fs.writeFileSync(outputPath, ediContent);
        
        console.log('\n======== EDI CONTENT PREVIEW ========');
        console.log(ediContent.substring(0, 500) + '...');
        console.log('====================================');
        
        console.log(`\nFull content saved to: ${path.resolve(outputPath)}`);
        console.log(`Generated ${ediContent.split('~').length - 1} segments`);
        
        // Clean up temp directory when done
        console.log('\nCleaning up temporary files...');
        
      } catch (err) {
        console.error('Error importing or running generator:', err);
      }
    });
  } catch (err) {
    console.error('Error setting up test:', err);
  }
});
