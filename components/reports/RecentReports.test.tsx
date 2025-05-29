import React from 'react';
import { render, screen } from '@testing-library/react';
import { RecentReports } from './RecentReports';
import '@testing-library/jest-dom';

describe('RecentReports', () => {
  it('renders the RecentReports component', () => {
    render(<RecentReports />);
    expect(screen.getByText(/RecentReports Component/i)).toBeInTheDocument();
  });
});
