import { describe, expect, it } from 'vitest';
import { Abca12Profile } from './Abca12Profile';
import { DefaultProfile } from './DefaultProfile';
import { WeBuildProfile } from './WeBuildProfile';

const metadata = {
	issuer: 'https://as.example',
	token_endpoint: 'https://as.example/token',
};
const standaloneAttestation = { token_endpoint_auth_methods_supported: ['none', 'attest_jwt_client_auth'] };
const es256Dpop = { dpop_signing_alg_values_supported: ['ES256'] };
const anonymousAccess = { 'pre-authorized_grant_anonymous_access_supported': true };

describe('pre-authorized token policy', () => {
	it('defaults to anonymous redemption without DPoP when neither capability is advertised', () => {
		expect(DefaultProfile.resolvePreAuthorizedTokenPolicy(metadata)).toEqual({
			clientAuthentication: 'anonymous',
			useDpop: false,
		});
	});

	it('allows anonymous redemption with ES256 DPoP even when the AS also supports attestation', () => {
		expect(
			DefaultProfile.resolvePreAuthorizedTokenPolicy({
				...metadata,
				...standaloneAttestation,
				...es256Dpop,
				...anonymousAccess,
			}),
		).toEqual({ clientAuthentication: 'anonymous', useDpop: true });
	});

	it.each([undefined, false])('uses advertised attestation when the anonymous flag is %s', (anonymous) => {
		expect(
			DefaultProfile.resolvePreAuthorizedTokenPolicy({
				...metadata,
				...standaloneAttestation,
				'pre-authorized_grant_anonymous_access_supported': anonymous,
				dpop_signing_alg_values_supported: ['ES384'],
			}),
		).toEqual({ clientAuthentication: 'attestation', useDpop: false });
	});

	it('requires attestation in ABCA12 even when the AS also allows anonymous redemption', () => {
		expect(
			Abca12Profile.resolvePreAuthorizedTokenPolicy({ ...metadata, ...standaloneAttestation, ...anonymousAccess }),
		).toEqual({ clientAuthentication: 'attestation', useDpop: false });
	});

	it.each([Abca12Profile, WeBuildProfile])('rejects combined-only attestation in strict profiles', (profile) => {
		expect(() =>
			profile.resolvePreAuthorizedTokenPolicy({
				...metadata,
				...es256Dpop,
				token_endpoint_auth_methods_supported: ['attest_jwt_client_auth_dpop'],
			}),
		).toThrow('does not support standalone client attestation');
	});

	it('requires ES256 DPoP and attestation in WEBUILD', () => {
		expect(() => WeBuildProfile.resolvePreAuthorizedTokenPolicy({ ...metadata, ...standaloneAttestation })).toThrow(
			'requires ES256 DPoP',
		);
		expect(
			WeBuildProfile.resolvePreAuthorizedTokenPolicy({ ...metadata, ...standaloneAttestation, ...es256Dpop }),
		).toEqual({ clientAuthentication: 'attestation', useDpop: true });
	});
});
