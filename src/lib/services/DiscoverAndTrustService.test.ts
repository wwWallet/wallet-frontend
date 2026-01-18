import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

import {
	discoverAndTrust,
	discoverAndTrustIssuer,
	discoverAndTrustVerifier,
	isDiscoverAndTrustAvailable,
	DiscoverAndTrustRequest,
	DiscoverAndTrustResponse,
} from './DiscoverAndTrustService';
import * as ApiVersionService from './ApiVersionService';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock ApiVersionService
vi.mock('./ApiVersionService', async () => {
	const actual = await vi.importActual('./ApiVersionService');
	return {
		...actual,
		getApiVersion: vi.fn(),
		getCachedApiVersion: vi.fn(),
	};
});

const mockedApiVersionService = vi.mocked(ApiVersionService);

describe('DiscoverAndTrustService', () => {
	const mockAuthToken = 'test-auth-token';
	const mockSuccessResponse: DiscoverAndTrustResponse = {
		trusted: true,
		reason: 'Found in trust list',
		discovery_status: 'success',
		trust_framework: 'eudi',
		trusted_certificates: ['-----BEGIN CERTIFICATE-----\nMIIB...'],
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('isDiscoverAndTrustAvailable', () => {
		it('should return true when cached version >= 2', () => {
			mockedApiVersionService.getCachedApiVersion.mockReturnValue(2);
			expect(isDiscoverAndTrustAvailable()).toBe(true);
		});

		it('should return false when cached version < 2', () => {
			mockedApiVersionService.getCachedApiVersion.mockReturnValue(1);
			expect(isDiscoverAndTrustAvailable()).toBe(false);
		});

		it('should return true when cached version > 2', () => {
			mockedApiVersionService.getCachedApiVersion.mockReturnValue(3);
			expect(isDiscoverAndTrustAvailable()).toBe(true);
		});
	});

	describe('discoverAndTrust', () => {
		it('should throw error when API version < 2', async () => {
			mockedApiVersionService.getApiVersion.mockResolvedValue(1);

			const request: DiscoverAndTrustRequest = {
				entity_identifier: 'https://issuer.example.com',
				role: 'issuer',
			};

			await expect(discoverAndTrust(request, mockAuthToken)).rejects.toThrow(
				'discover-and-trust requires API version 2'
			);
		});

		it('should make POST request when API version >= 2', async () => {
			mockedApiVersionService.getApiVersion.mockResolvedValue(2);
			mockedAxios.post.mockResolvedValueOnce({ data: mockSuccessResponse });

			const request: DiscoverAndTrustRequest = {
				entity_identifier: 'https://issuer.example.com',
				role: 'issuer',
			};

			const result = await discoverAndTrust(request, mockAuthToken);

			expect(mockedAxios.post).toHaveBeenCalledWith(
				expect.stringContaining('/api/discover-and-trust'),
				request,
				expect.objectContaining({
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
						Authorization: `Bearer ${mockAuthToken}`,
					}),
					timeout: 30000,
				})
			);
			expect(result).toEqual(mockSuccessResponse);
		});

		it('should include credential_type when provided', async () => {
			mockedApiVersionService.getApiVersion.mockResolvedValue(2);
			mockedAxios.post.mockResolvedValueOnce({ data: mockSuccessResponse });

			const request: DiscoverAndTrustRequest = {
				entity_identifier: 'https://issuer.example.com',
				role: 'issuer',
				credential_type: 'eu.europa.ec.eudi.pid.1',
			};

			await discoverAndTrust(request, mockAuthToken);

			expect(mockedAxios.post).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					credential_type: 'eu.europa.ec.eudi.pid.1',
				}),
				expect.any(Object)
			);
		});
	});

	describe('discoverAndTrustIssuer', () => {
		it('should call discoverAndTrust with role=issuer', async () => {
			mockedApiVersionService.getApiVersion.mockResolvedValue(2);
			mockedAxios.post.mockResolvedValueOnce({ data: mockSuccessResponse });

			await discoverAndTrustIssuer('https://issuer.example.com', mockAuthToken);

			expect(mockedAxios.post).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					entity_identifier: 'https://issuer.example.com',
					role: 'issuer',
				}),
				expect.any(Object)
			);
		});

		it('should include credential_type when provided', async () => {
			mockedApiVersionService.getApiVersion.mockResolvedValue(2);
			mockedAxios.post.mockResolvedValueOnce({ data: mockSuccessResponse });

			await discoverAndTrustIssuer(
				'https://issuer.example.com',
				mockAuthToken,
				'eu.europa.ec.eudi.pid.1'
			);

			expect(mockedAxios.post).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					credential_type: 'eu.europa.ec.eudi.pid.1',
				}),
				expect.any(Object)
			);
		});
	});

	describe('discoverAndTrustVerifier', () => {
		it('should call discoverAndTrust with role=verifier', async () => {
			mockedApiVersionService.getApiVersion.mockResolvedValue(2);
			mockedAxios.post.mockResolvedValueOnce({ data: mockSuccessResponse });

			await discoverAndTrustVerifier('https://verifier.example.com', mockAuthToken);

			expect(mockedAxios.post).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					entity_identifier: 'https://verifier.example.com',
					role: 'verifier',
				}),
				expect.any(Object)
			);
		});
	});

	describe('error handling', () => {
		it('should propagate axios errors', async () => {
			mockedApiVersionService.getApiVersion.mockResolvedValue(2);
			mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

			const request: DiscoverAndTrustRequest = {
				entity_identifier: 'https://issuer.example.com',
				role: 'issuer',
			};

			await expect(discoverAndTrust(request, mockAuthToken)).rejects.toThrow('Network error');
		});
	});
});

describe('DiscoverAndTrustResponse types', () => {
	it('should accept valid response with all fields', () => {
		const response: DiscoverAndTrustResponse = {
			issuer_metadata: { credential_issuer: 'https://issuer.example.com' },
			trusted: true,
			reason: 'Trust established',
			trusted_certificates: ['-----BEGIN CERTIFICATE-----\n...'],
			trust_framework: 'eudi',
			discovery_status: 'success',
		};

		expect(response.trusted).toBe(true);
		expect(response.discovery_status).toBe('success');
	});

	it('should accept valid response with minimal fields', () => {
		const response: DiscoverAndTrustResponse = {
			trusted: false,
			reason: 'Not in trust list',
			discovery_status: 'failed',
			discovery_error: 'Connection refused',
		};

		expect(response.trusted).toBe(false);
		expect(response.discovery_status).toBe('failed');
	});

	it('should accept verifier response', () => {
		const response: DiscoverAndTrustResponse = {
			verifier_metadata: { client_id: 'verifier-123' },
			trusted: true,
			reason: 'Verified',
			discovery_status: 'success',
		};

		expect(response.verifier_metadata).toBeDefined();
	});
});
