import React from 'react'; // Make sure React is imported
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CredentialInfo from './CredentialInfo';
import i18n from 'i18next'; // Assuming i18n is properly set up in your project

// Setup a baseline language for all tests if needed
beforeEach(() => {
	i18n.changeLanguage('en');
});

// Reset language after each test to avoid side effects
afterEach(() => {
	i18n.changeLanguage('en');
});

describe('CredentialInfo Component', () => {

	const parsedCredential = {
		signedClaims: {
			firstname: "John",
			address: {
				street_address: "123 Main St",
				locality: {
					city: "Anytown",
				},
			},
			date_of_birth: "1990-10-15T00:00:00.000Z",
			age_over_18: true,
			grade: 8,
			expiry_date: 1773145579
		},
		metadata: {
			credential: {
				TypeMetadata: {
					claims: [
						{
							"path": ["firstname"],
							"display": [
								{
									"lang": "en-US",
									"label": "First Name",
									"description": "The first name of the individual"
								}
							],
							"svg_id": "firstname"
						},
						{
							"path": ["address", "street_address"],
							"display": [
								{
									"lang": "en-US",
									"label": "Street Address",
									"description": "The street address of the individual"
								}
							],
							"svg_id": "street_address"
						},
						{
							"path": ["address", "locality", "city"],
							"display": [
								{
									"lang": "en-US",
									"label": "City",
									"description": "The city of the individual's address"
								}
							],
							"svg_id": "city"
						},
						{
							"path": ["date_of_birth"],
							"display": [
								{
									"lang": "en-US",
									"label": "Date of Birth",
									"description": "The birthdate of the individual"
								}
							],
							"svg_id": "date_of_birth"
						},
						{
							"path": ["expiry_date"],
							"display": [
								{
									"lang": "en-US",
									"label": "Expiry Date",
									"description": "The Expiry Date"
								}
							],
							"svg_id": "expiry_date"
						},
						{
							"path": ["age_over_18"],
							"display": [
								{
									"lang": "en-US",
									"label": "Over 18",
									"description": "Indicates if the individual is over the age of 18"
								}
							],
							"svg_id": "age_over_18"
						},
						{
							"path": ["grade"],
							"display": [
								{
									"lang": "en-US",
									"label": "Grade",
									"description": "The current grade level of the individual"
								}
							],
							"svg_id": "grade"
						}
					]
				}
			}
		}
	}

	it('renders without crashing', () => {
		render(<CredentialInfo />);
		expect(screen.getByTestId('credential-info')).toBeInTheDocument();
	});

	it('renders without claims', () => {

		const parsedCredential = {
			signedClaims: {
				given_name: "John",
			},
			metadata: {
				credential: {
					TypeMetadata:
						{}
				}
			}
		}
		render(<CredentialInfo parsedCredential={parsedCredential} />);
		expect(screen.getByTestId('credential-info')).toBeInTheDocument();
		expect(screen.getByText('Given Name:')).toBeInTheDocument();


	});

	it('renders with empty claims array', () => {

		const parsedCredential = {
			signedClaims: {
				given_name: "John",
			},
			metadata: {
				credential: {
					TypeMetadata: {
						claims: []
					}
				}
			}
		}
		render(<CredentialInfo parsedCredential={parsedCredential} />);
		const firstNameElement = screen.queryByText('Given Name:');
		expect(firstNameElement).not.toBeInTheDocument();
	});

	it('renders claims when data is provided', () => {

		render(<CredentialInfo parsedCredential={parsedCredential} />);
		expect(screen.getByText('First Name:')).toBeInTheDocument();
		expect(screen.getByText('John')).toBeInTheDocument();
		expect(screen.getByText('Street Address:')).toBeInTheDocument();
		expect(screen.getByText('123 Main St')).toBeInTheDocument();
		expect(screen.getByText('City:')).toBeInTheDocument();
		expect(screen.getByText('Anytown')).toBeInTheDocument();
		expect(screen.getByText('Date of Birth:')).toBeInTheDocument();
		expect(screen.getByText('15/10/1990')).toBeInTheDocument();
		expect(screen.getByText('Expiry Date:')).toBeInTheDocument();
		expect(screen.getByText('10/03/2026')).toBeInTheDocument();
		expect(screen.getByText('Over 18:')).toBeInTheDocument();
		expect(screen.getByText('true')).toBeInTheDocument();
		expect(screen.getByText('Grade:')).toBeInTheDocument();
		expect(screen.getByText('8')).toBeInTheDocument();
	});


	it('renders claims when the dafult language not exists in display languages', () => {
		i18n.changeLanguage('el'); // Change to greek

		render(<CredentialInfo parsedCredential={parsedCredential} />);
		expect(screen.getByText('First Name:')).toBeInTheDocument();
		expect(screen.getByText('John')).toBeInTheDocument();
		expect(screen.getByText('Street Address:')).toBeInTheDocument();
		expect(screen.getByText('123 Main St')).toBeInTheDocument();
		expect(screen.getByText('City:')).toBeInTheDocument();
		expect(screen.getByText('Anytown')).toBeInTheDocument();
		expect(screen.getByText('Date of Birth:')).toBeInTheDocument();
		expect(screen.getByText('15/10/1990')).toBeInTheDocument();
		expect(screen.getByText('Expiry Date:')).toBeInTheDocument();
		expect(screen.getByText('10/03/2026')).toBeInTheDocument();
		expect(screen.getByText('Over 18:')).toBeInTheDocument();
		expect(screen.getByText('true')).toBeInTheDocument();
		expect(screen.getByText('Grade:')).toBeInTheDocument();
		expect(screen.getByText('8')).toBeInTheDocument();
	});

	it('renders claims with other language', () => {

		const parsedCredential = {
			signedClaims: {
				firstname: "John",
				address: {
					street_address: "123 Main St",
					locality: {
						city: "Anytown",
					},
				},
				date_of_birth: "1990-10-15T00:00:00.000Z",
				age_over_18: true,
				grade: 8,
				expiry_date: 1773145579
			},
			metadata: {
				credential: {
					TypeMetadata: {
						claims: [
							{
								"path": ["firstname"],
								"display": [
									{
										"lang": "en-US",
										"label": "First Name",
										"description": "The first name of the individual"
									},
									{
										"lang": "el-GR",
										"label": "Όνομα",
										"description": "Το όνομα του ατόμου"
									}
								],
								"svg_id": "firstname"
							},
							{
								"path": ["address", "street_address"],
								"display": [
									{
										"lang": "en-US",
										"label": "Street Address",
										"description": "The street address of the individual"
									},
									{
										"lang": "el-GR",
										"label": "Διεύθυνση",
										"description": "Η διεύθυνση του ατόμου"
									}
								],
								"svg_id": "street_address"
							},
							{
								"path": ["address", "locality", "city"],
								"display": [
									{
										"lang": "en-US",
										"label": "City",
										"description": "The city of the individual's address"
									},
									{
										"lang": "el-GR",
										"label": "Πόλη",
										"description": "Η πόλη της διεύθυνσης του ατόμου"
									}
								],
								"svg_id": "city"
							},
							{
								"path": ["date_of_birth"],
								"display": [
									{
										"lang": "en-US",
										"label": "Date of Birth",
										"description": "The birthdate of the individual"
									},
									{
										"lang": "el-GR",
										"label": "Ημερομηνία Γέννησης",
										"description": "Η ημερομηνία γέννησης του ατόμου"
									}
								],
								"svg_id": "date_of_birth"
							},
							{
								"path": ["age_over_18"],
								"display": [
									{
										"lang": "en-US",
										"label": "Over 18",
										"description": "Indicates if the individual is over the age of 18"
									},
									{
										"lang": "el-GR",
										"label": "Άνω των 18",
										"description": "Δηλώνει εάν το άτομο είναι άνω των 18 ετών"
									}
								],
								"svg_id": "age_over_18"
							},
							{
								"path": ["grade"],
								"display": [
									{
										"lang": "en-US",
										"label": "Grade",
										"description": "The current grade level of the individual"
									},
									{
										"lang": "el-GR",
										"label": "Βαθμίδα",
										"description": "Η τρέχουσα βαθμίδα του ατόμου"
									}
								],
								"svg_id": "grade"
							},
							{
								"path": ["expiry_date"],
								"display": [
									{
										"lang": "en-US",
										"label": "Expiry Date",
										"description": "The expiry date of the credential"
									},
									{
										"lang": "el-GR",
										"label": "Ημερομηνία Λήξης",
										"description": "Η ημερομηνία λήξης του πιστοποιητικού"
									}
								],
								"svg_id": "expiry_date"
							}
						]
					}
				}
			}
		};

		i18n.changeLanguage('el'); // Change to Italian

		render(<CredentialInfo parsedCredential={parsedCredential} />);
		expect(screen.getByText('Όνομα:')).toBeInTheDocument();
		expect(screen.getByText('John')).toBeInTheDocument();
		expect(screen.getByText('Διεύθυνση:')).toBeInTheDocument();
		expect(screen.getByText('123 Main St')).toBeInTheDocument();
		expect(screen.getByText('Πόλη:')).toBeInTheDocument();
		expect(screen.getByText('Anytown')).toBeInTheDocument();
		expect(screen.getByText('Ημερομηνία Γέννησης:')).toBeInTheDocument();
		expect(screen.getByText('15/10/1990')).toBeInTheDocument();
		expect(screen.getByText('Ημερομηνία Λήξης:')).toBeInTheDocument();
		expect(screen.getByText('10/03/2026')).toBeInTheDocument();
		expect(screen.getByText('Άνω των 18:')).toBeInTheDocument();
		expect(screen.getByText('true')).toBeInTheDocument();
		expect(screen.getByText('Βαθμίδα:')).toBeInTheDocument();
		expect(screen.getByText('8')).toBeInTheDocument();
	});
});
