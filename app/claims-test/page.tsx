'use client';

import { useState } from 'react';
import styles from './claims-test.module.css';

/**
 * Claims Testing Interface
 * 
 * This page provides a UI for testing the enhanced claims processor functionality.
 * It allows creating test claims and running various processor functions.
 * 
 * NOTE: This page is for development/testing only and should be disabled in production.
 */
export default function ClaimsTestPage() {
  const [action, setAction] = useState('processClaim');
  const [claimId, setClaimId] = useState('');
  const [userId, setUserId] = useState('');
  const [insurancePlanId, setInsurancePlanId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Reset form when action changes
  const handleActionChange = (newAction: string) => {
    setAction(newAction);
    setClaimId('');
    setUserId('');
    setInsurancePlanId('');
    setError(null);
    setResult(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setToast(null);

    try {
      const response = await fetch('/api/claims/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          claimId,
          userId,
          insurancePlanId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'An error occurred');
      }

      setResult(data.result);
      setToast({
        type: 'success',
        message: `${action} completed successfully`
      });
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setError((err as Error).message);
      setToast({
        type: 'error',
        message: (err as Error).message
      });
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => setToast(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (action) {
      case 'processClaim':
        return (
          <div className={styles.formControl}>
            <label className={styles.formLabel}>Claim ID *</label>
            <input
              type="text"
              className={styles.input}
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              placeholder="Enter claim ID"
              required
            />
            <p className={styles.helpText}>
              Or select "Create Test Claim" to generate a new test claim
            </p>
          </div>
        );

      case 'createTestClaim':
        return (
          <div className={styles.formControl}>
            <label className={styles.formLabel}>User ID *</label>
            <input
              type="text"
              className={styles.input}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              required
            />
            <label className={styles.formLabel} style={{ marginTop: '1rem' }}>Insurance Plan ID *</label>
            <input
              type="text"
              className={styles.input}
              value={insurancePlanId}
              onChange={(e) => setInsurancePlanId(e.target.value)}
              placeholder="Enter insurance plan ID"
              required
            />
          </div>
        );

      case 'analyzeDenialRisk':
        return (
          <div className={styles.formControl}>
            <label className={styles.formLabel}>Claim ID *</label>
            <input
              type="text"
              className={styles.input}
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              placeholder="Enter claim ID"
              required
            />
          </div>
        );

      case 'checkEligibility':
        return (
          <div className={styles.formControl}>
            <label className={styles.formLabel}>Claim ID *</label>
            <input
              type="text"
              className={styles.input}
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              placeholder="Enter claim ID"
              required
            />
            <p className={styles.helpText}>
              The claim must be created first and associated with an insurance plan
            </p>
          </div>
        );

      case 'optimizeRevenue':
        return (
          <div className={styles.formControl}>
            <label className={styles.formLabel}>User ID *</label>
            <textarea
              className={styles.textarea}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              required
            />
          </div>
        );

      case 'createTestClaim':
        return (
          <div className={styles.formControl}>
            <label className={styles.formLabel}>Insurance Plan ID (Optional)</label>
            <textarea
              className={styles.textarea}
              value={insurancePlanId}
              onChange={(e) => setInsurancePlanId(e.target.value)}
              placeholder="Leave blank to use default or create new"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Claims Processor Test Interface</h1>
      <p className={styles.description}>
        Use this interface to test the enhanced claims processor functionality.
      </p>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Test Actions</h2>
        
        <div className={styles.formControl}>
          <label className={styles.formLabel}>Select Action</label>
          <select 
            className={styles.select}
            value={action}
            onChange={(e) => handleActionChange(e.target.value)}
          >
            <option value="processClaim">Process Claim</option>
            <option value="createTestClaim">Create Test Claim</option>
            <option value="analyzeDenialRisk">Analyze Denial Risk</option>
            <option value="checkEligibility">Check Eligibility</option>
          </select>
        </div>

        {renderForm()}

        <div className={styles.buttonContainer}>
          <button 
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={handleSubmit}
            disabled={loading || 
              (action === 'processClaim' && !claimId) || 
              (action === 'createTestClaim' && (!userId || !insurancePlanId)) ||
              (action === 'analyzeDenialRisk' && !claimId) ||
              (action === 'checkEligibility' && !claimId)}
          >
            {loading ? 'Processing...' : 
              (action === 'createTestClaim' ? 'Create Test Claim' : 'Submit')}
          </button>
        </div>

        {error && (
          <div className={styles.alert}>
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Processing request...</p>
          </div>
        )}

        {result && (
          <div className={styles.card}>
            <div className={styles.cardContent}>
              <h2 className={styles.subheading}>Result</h2>
              <div className={styles.codeBlock}>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.cardContent}>
            <h2 className={styles.subheading}>Testing Instructions</h2>
            <p>
              <strong>1. Create a test claim:</strong> Start by creating a test claim using the "Create Test Claim" action.
              Copy the claim ID from the result.
            </p>
            <p>
              <strong>2. Process the claim:</strong> Use the "Process New Claim" action with the claim ID to process it.
              This will run eligibility checks, denial prediction, and validation.
            </p>
            <p>
              <strong>3. Analyze denial risk:</strong> Use the "Analyze Denial Risk" action to get detailed risk analysis.
            </p>
            <p>
              <strong>4. Check eligibility:</strong> Use the "Check Eligibility" action with an insurance plan ID to verify coverage.
            </p>
            <p>
              <strong>5. Optimize revenue:</strong> Use the "Optimize Revenue" action with a user ID to get optimization suggestions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
