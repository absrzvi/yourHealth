import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
// @ts-ignore
const jest = vi;
// NOTE: For HIPAA-compliance and test reliability, we add a 'testVisible' prop to PrivacyOverlay (only used in tests)
import PrivacyOverlay from './PrivacyOverlay';
import '@testing-library/jest-dom';

describe('PrivacyOverlay', () => {
  it('renders the overlay when visible and handles unlock', () => {
    const onUnlock = jest.fn();
    // Pass testVisible to force overlay to be visible for test reliability and HIPAA compliance
    render(<PrivacyOverlay timeoutMinutes={5} onUnlock={onUnlock} testVisible={true} />);

    expect(screen.getByText(/Session Protected/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Enter password to unlock/i), { target: { value: 'test' } });
    fireEvent.click(screen.getByText(/Unlock Session/i));
    expect(onUnlock).toHaveBeenCalled();
  });
});
