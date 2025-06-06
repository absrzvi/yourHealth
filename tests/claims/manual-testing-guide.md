# Insurance Claims Workflow Manual Testing Guide

This guide provides step-by-step instructions for manually testing the enhanced insurance claims processing workflow in the For Your Health MVP.

## Prerequisites

1. Ensure your database is properly migrated and seeded
2. Make sure you're logged in as a user with existing claims data
3. Have the Jest testing framework installed for automated tests

## 1. Running Automated Tests

```bash
# Run the enhanced processor tests
npm test -- tests/claims/enhanced-processor.test.ts

# Run all claims-related tests
npm test -- tests/claims
```

## 2. Manual Testing Steps

### 2.1 Testing the Enhanced Claims Processor

#### Create a Test Claim

1. Navigate to the Claims Dashboard
2. Click "Create New Claim"
3. Fill in the following test data:
   - Insurance Plan: Select an existing plan
   - Report: Select a lab report with biomarker data
   - CPT Code: 80053 (Comprehensive Metabolic Panel)
   - ICD-10 Code: E11.9 (Type 2 diabetes without complications)
   - Service Date: Today's date
   - Charge: $45.00
4. Click "Submit Claim"
5. Verify the claim is created with "DRAFT" status

#### Process the Claim

1. From the Claims Dashboard, find your test claim
2. Click "Process Claim"
3. Verify the following occurs:
   - Eligibility check is performed
   - Denial risk analysis is shown
   - Claim validation results are displayed
   - CPT codes are generated from the report
   - Claim status changes to "SUBMITTED"

### 2.2 Testing the Denial Predictor

1. From the Claims Dashboard, select a claim
2. Click "Analyze Denial Risk"
3. Verify the following information is displayed:
   - Denial probability percentage
   - Risk factors identified
   - Recommended actions
   - Overall risk score

4. Test with different scenarios:
   - A claim with missing prior authorization
   - A claim with frequency limits exceeded
   - A claim with invalid diagnosis codes

### 2.3 Testing the Revenue Optimizer

1. Navigate to the Revenue Optimization section
2. Click "Generate Optimization Report"
3. Verify the following metrics are displayed:
   - Total billed amount
   - Total collected amount
   - Collection rate percentage
   - Average days to payment
   - Denial rate percentage

4. Check that optimization suggestions are provided for:
   - Improving collection rates
   - Reducing denial rates
   - Optimizing CPT code usage
   - Improving billing timing

### 2.4 Testing the Specimen Tracker

1. Navigate to the Specimen Management section
2. Create a new specimen record with:
   - Specimen ID
   - Collection date/time
   - Specimen type
   - Collection location
3. Document chain of custody:
   - Add a transfer event
   - Add a processing event
4. Verify specimen status updates correctly
5. Generate and scan a barcode for the specimen

### 2.5 Testing the Medical Necessity Validator

1. Navigate to the Claims Dashboard
2. Select a claim
3. Click "Validate Medical Necessity"
4. Verify the following checks are performed:
   - CPT code is appropriate for diagnosis
   - Service is medically necessary
   - Frequency limits are respected
   - Documentation requirements are met
5. If validation fails, verify appropriate letters are generated

## 3. Edge Case Testing

### 3.1 Handling Duplicate Claims

1. Create a claim with the same service date and CPT code as an existing claim
2. Process the claim
3. Verify the duplicate is detected and flagged

### 3.2 Testing Timely Filing Limits

1. Create a claim with a service date older than the payer's filing limit
2. Process the claim
3. Verify the timely filing issue is detected and flagged

### 3.3 Testing Excluded Services

1. Create a claim with a CPT code that is excluded by the insurance plan
2. Process the claim
3. Verify the excluded service is detected and flagged

## 4. Integration Testing

### 4.1 End-to-End Claim Lifecycle

1. Create a new claim (DRAFT)
2. Process the claim (SUBMITTED)
3. Update the claim status to PROCESSING
4. Update the claim status to ACCEPTED
5. Add a payment event
6. Update the claim status to PAID
7. Verify all status transitions work correctly
8. Verify claim events are properly recorded

### 4.2 Revenue Analysis After Claims Processing

1. Process several claims with different statuses
2. Navigate to the Revenue Dashboard
3. Verify the dashboard accurately reflects:
   - Claim counts by status
   - Payment trends
   - Denial patterns
   - Revenue forecasts

## 5. Performance Testing

1. Create a batch of 10+ claims
2. Process all claims in sequence
3. Measure and record processing time
4. Verify system remains responsive

## Test Results Documentation

For each test section, document:
- Pass/Fail status
- Any errors encountered
- Screenshots of issues
- Suggestions for improvements

Submit test results to the development team for review.
