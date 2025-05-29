import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';
import '@testing-library/jest-dom';

describe('Sidebar', () => {
  it('renders the sidebar with navigation and health score', () => {
    render(<Sidebar />);
    expect(screen.getByText(/For Your Health/i)).toBeInTheDocument();
    expect(screen.getByText(/Health Score/i)).toBeInTheDocument();
  });
});
