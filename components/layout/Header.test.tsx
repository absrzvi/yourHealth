import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from './Header';
import '@testing-library/jest-dom';

describe('Header', () => {
  it('renders the main header and action buttons', () => {
    render(<Header />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Export Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact Doctor/i)).toBeInTheDocument();
  });
});
