import { LocalStorageKeystore } from '../../services/LocalStorageKeystore';
import { useHttpProxy } from "./HttpProxy/HttpProxy";


export const FIELD_PRE_AUTHORIZED_CODE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:pre-authorized_code';
export const FIELD_AUTHORIZATION_CODE_GRANT_TYPE = 'authorization_code';
export const FIELD_PRE_AUTHORIZED_CODE = 'pre-authorized_code';
const PATH_TOKEN = '/token';

interface TokenResponse {
	accessToken: string;
	cNonce: string;
}
