import { OPENID4VCI_PROFILE } from '@/config';
import { Abca12Profile } from './Abca12Profile';
import { DefaultProfile } from './DefaultProfile';
import { WeBuildProfile } from './WeBuildProfile';
import type { OpenID4VCIProfile } from './types';

export function loadOpenID4VCIProfile(id: string): OpenID4VCIProfile {
	switch (id) {
		case 'DEFAULT':
			return DefaultProfile;
		case 'ABCA12':
			return Abca12Profile;
		case 'WEBUILD':
			return WeBuildProfile;
		default:
			throw new Error(`Unknown OpenID4VCI profile: ${id}`);
	}
}

export function getOpenID4VCIProfile(): OpenID4VCIProfile {
	return loadOpenID4VCIProfile(OPENID4VCI_PROFILE);
}
