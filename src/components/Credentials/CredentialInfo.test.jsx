import React from 'react'; // Make sure React is imported
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CredentialInfo from './CredentialInfo';
import '@testing-library/jest-dom';

describe('CredentialInfo Component', () => {

  it('renders without crashing', () => {
    render(<CredentialInfo />);
		expect(screen.getByTestId('credential-info')).toBeInTheDocument();
  });

  // it('renders claims correctly when data is provided', () => {
  //   const signedClaims = {
  //     name: 'John Doe',
  //     dob: '1990-01-01',
  //   };
  //   const claims = [
  //     { display: [{ lang: 'en', label: 'Name' }], path: ['name'] },
  //     { display: [{ lang: 'en', label: 'Date of Birth' }], path: ['dob'] },
  //   ];

  //   render(<CredentialInfo signedClaims={signedClaims} claims={claims} />);
  //   expect(screen.getByText('Name:')).toBeInTheDocument();
  //   expect(screen.getByText('John Doe')).toBeInTheDocument();
  //   expect(screen.getByText('Date of Birth:')).toBeInTheDocument();
  // });

  // it('handles missing claims and signedClaims gracefully', () => {
  //   render(<CredentialInfo />);
  //   expect(screen.queryByText(/:/)).not.toBeInTheDocument();
  // });
});
