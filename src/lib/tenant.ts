/**
 * Tenant utilities for multi-tenancy support.
 *
 * URL Structure:
 * - Default tenant uses root paths: /, /settings, /login (backwards compatible)
 * - Custom tenants use /id/ prefix: /id/{tenantId}/, /id/{tenantId}/settings
 *
 * Multi-tenancy Design:
 * - Login is global (tenant-discovering): The user selects a passkey, and the tenant
 *   is determined from the passkey's userHandle which encodes "tenantId:userId"
 * - Registration is tenant-scoped: When registering within a tenant context,
 *   the tenant ID is passed in the request body
 * - After login, the backend returns the tenant_id which should be stored
 *   and used for subsequent API calls and routing
 *
 * See go-wallet-backend/docs/adr/011-multi-tenancy.md for full design.
 */

const TENANT_STORAGE_KEY = 'wallet_tenant_id';

/**
 * URL path prefix for custom (non-default) tenants.
 * Custom tenants are accessed via /id/{tenantId}/*
 */
export const TENANT_PATH_PREFIX = 'id';

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
 * Default tenant uses root paths (/) for backwards compatibility.
 */
export const DEFAULT_TENANT_ID = 'default';

/**
 * Tenant names that are reserved and cannot be used for custom tenants.
 * - 'id' - Used as the URL prefix for custom tenants (/id/{tenant}/)
 * - 'default' - Reserved for the default tenant
 */
const RESERVED_TENANT_NAMES = new Set(['id', 'default']);

/**
 * Check if a tenant ID represents the default tenant.
 * Default tenant users should use the root path (/) instead of /id/default/.
 */
export function isDefaultTenant(tenantId: string | undefined): boolean {
	return !tenantId || tenantId === DEFAULT_TENANT_ID;
}

/**
 * Check if a tenant name is reserved and cannot be used for custom tenants.
 */
export function isReservedTenantName(name: string): boolean {
	return RESERVED_TENANT_NAMES.has(name.toLowerCase());
}

/**
 * Build the frontend route path for a given tenant.
 * - Default tenant uses root paths: / (backwards compatible)
 * - Custom tenants use /id/{tenantId}/ prefix
 *
 * @param tenantId - The tenant ID
 * @param subPath - Optional path within the tenant (e.g., 'settings')
 * @returns The frontend route path
 */
export function buildTenantRoutePath(tenantId: string | undefined, subPath?: string): string {
	const cleanSubPath = subPath?.startsWith('/') ? subPath.slice(1) : (subPath || '');

	// Default tenant uses root paths (backwards compatible)
	if (isDefaultTenant(tenantId)) {
		return cleanSubPath ? `/${cleanSubPath}` : '/';
	}

	// Custom tenants use /id/{tenantId}/ prefix
	return cleanSubPath
		? `/${TENANT_PATH_PREFIX}/${tenantId}/${cleanSubPath}`
		: `/${TENANT_PATH_PREFIX}/${tenantId}/`;
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

/**
 * Paths that should use tenant-scoped backend endpoints.
 * For non-default tenants, these paths are prefixed with /tenant/{tenantId}.
 */
const TENANT_SCOPED_API_PATHS = ['/issuer/all', '/verifier/all'];

/**
 * Build the backend API path for tenant-scoped resources.
 * - Default tenant uses direct paths: /issuer/all, /verifier/all
 * - Custom tenants use /tenant/{tenantId}/ prefix: /tenant/myTenant/issuer/all
 *
 * @param path - The API path (e.g., '/issuer/all')
 * @param tenantId - The tenant ID (from getStoredTenant)
 * @returns The backend API path
 */
export function buildTenantApiPath(path: string, tenantId?: string): string {
	if (!TENANT_SCOPED_API_PATHS.includes(path)) {
		return path;
	}

	if (isDefaultTenant(tenantId)) {
		return path;
	}

	return `/tenant/${tenantId}${path}`;
}

/**
 * Check if a path is a tenant-scoped API path (possibly prefixed with /tenant/{tenantId}).
 * Returns the base path (e.g., '/issuer/all') if it's a tenant-scoped path.
 */
export function getTenantScopedBasePath(path: string): string | null {
	// Direct match
	if (TENANT_SCOPED_API_PATHS.includes(path)) {
		return path;
	}

	// Check for /tenant/{tenantId}/... prefix
	const tenantPrefixMatch = path.match(/^\/tenant\/[^/]+(\/.*)$/);
	if (tenantPrefixMatch) {
		const basePath = tenantPrefixMatch[1];
		if (TENANT_SCOPED_API_PATHS.includes(basePath)) {
			return basePath;
		}
	}

	return null;
}
