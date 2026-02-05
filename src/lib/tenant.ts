/**
 * Tenant utilities for multi-tenancy support.
 *
 * Multi-tenancy Design:
 * - Login is global (tenant-discovering): The user selects a passkey, and the tenant
 *   is determined from the passkey's userHandle which encodes "tenantId:userId"
 * - Registration is tenant-scoped: When registering within a tenant context,
 *   the registration endpoint includes the tenant ID in the path
 * - After login, the backend returns the tenant_id which should be stored
 *   and used for subsequent API calls and routing
 *
 * See go-wallet-backend/docs/adr/011-multi-tenancy.md for full design.
 */

const TENANT_STORAGE_KEY = 'wallet_tenant_id';

/**
 * Get the stored tenant ID from sessionStorage.
 * Returns undefined if no tenant is stored (single-tenant or not yet logged in).
 */
export function getStoredTenant(): string | undefined {
	const tenant = sessionStorage.getItem(TENANT_STORAGE_KEY);
	return tenant || undefined;
}

/**
 * Store the current tenant ID in sessionStorage.
 * Called after successful login when the backend returns the tenant.
 */
export function setStoredTenant(tenantId: string): void {
	sessionStorage.setItem(TENANT_STORAGE_KEY, tenantId);
}

/**
 * Clear the stored tenant ID.
 * Called on logout.
 */
export function clearStoredTenant(): void {
	sessionStorage.removeItem(TENANT_STORAGE_KEY);
}

// Note: buildTenantApiPath was removed. Registration and login now use global endpoints
// with tenantId passed in the request body instead of the URL path.

/**
 * The default tenant ID used by the backend for single-tenant mode
 * and legacy users without tenant association.
 */
export const DEFAULT_TENANT_ID = 'default';

/**
 * Check if a tenant ID represents the default tenant.
 * Default tenant users should use the root path (/) instead of /default/.
 */
export function isDefaultTenant(tenantId: string | undefined): boolean {
	return !tenantId || tenantId === DEFAULT_TENANT_ID;
}

/**
 * Build the frontend route path for a given tenant.
 * - Non-default tenants: /{tenantId}/
 * - Default tenant: /
 *
 * @param tenantId - The tenant ID
 * @param subPath - Optional path within the tenant (e.g., 'settings')
 * @returns The frontend route path
 */
export function buildTenantRoutePath(tenantId: string | undefined, subPath?: string): string {
	const cleanSubPath = subPath?.startsWith('/') ? subPath.slice(1) : (subPath || '');

	if (isDefaultTenant(tenantId)) {
		return cleanSubPath ? `/${cleanSubPath}` : '/';
	}

	return cleanSubPath ? `/${tenantId}/${cleanSubPath}` : `/${tenantId}/`;
}

/**
 * Check if multi-tenancy is active (a tenant is stored).
 */
export function isMultiTenantActive(): boolean {
	return !!getStoredTenant();
}

/**
 * Extract tenant ID from a WebAuthn userHandle.
 *
 * The userHandle is encoded as "{tenantId}:{userId}" by the backend.
 * This function extracts the tenant ID prefix.
 *
 * @param userHandle - The userHandle from WebAuthn (as Uint8Array, ArrayBuffer, or string)
 * @returns The extracted tenant ID, or undefined if not found or format is invalid
 */
export function extractTenantFromUserHandle(userHandle: ArrayBuffer | Uint8Array | string | null | undefined): string | undefined {
	if (!userHandle) {
		return undefined;
	}

	let handleStr: string;
	if (typeof userHandle === 'string') {
		handleStr = userHandle;
	} else {
		// Convert ArrayBuffer/Uint8Array to string
		const bytes = userHandle instanceof Uint8Array ? userHandle : new Uint8Array(userHandle);
		handleStr = new TextDecoder().decode(bytes);
	}

	// Format is "{tenantId}:{userId}" - extract the tenant part
	const colonIndex = handleStr.indexOf(':');
	if (colonIndex === -1) {
		// No colon found - this might be a legacy user handle without tenant prefix
		// Return undefined to indicate no tenant
		return undefined;
	}

	const tenantId = handleStr.substring(0, colonIndex);
	return tenantId || undefined;
}

// Note: Login now uses global endpoints only (/user/login-webauthn-begin and /user/login-webauthn-finish).
// The backend discovers the tenant from the passkey's userHandle which contains a hashed tenant ID.
// Registration continues to use tenant-scoped paths for explicit tenant context.
