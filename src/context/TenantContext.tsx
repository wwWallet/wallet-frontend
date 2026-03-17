/**
 * TenantContext - React context for multi-tenancy support.
 *
 * URL Structure:
 * - Default tenant uses root paths: /, /settings, /login (backwards compatible)
 * - Custom tenants use /id/ prefix: /id/{tenantId}/, /id/{tenantId}/settings
 *
 * The tenant ID can come from multiple sources (in order of precedence):
 * 1. URL path parameter (/id/:tenantId/*) - for path-based routing
 * 2. Explicitly passed tenantId prop - for components that know the tenant
 * 3. SessionStorage - cached from previous login/registration
 *
 * Usage:
 *   // In App.tsx, wrap tenant-scoped routes:
 *   <Route path="/id/:tenantId/*" element={<TenantProvider><TenantRoutes /></TenantProvider>} />
 *
 *   // In components:
 *   const { tenantId } = useTenant();
 *   api.signupWebauthn(name, keystore, ..., tenantId);
 *
 * See go-wallet-backend/docs/adr/011-multi-tenancy.md for full design.
 */

import React, { createContext, useContext, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { getStoredTenant, setStoredTenant, clearStoredTenant, buildTenantRoutePath, TENANT_PATH_PREFIX } from '../lib/tenant';

export interface TenantContextValue {
	/** Current tenant ID (from URL, prop, or storage) */
	effectiveTenantId: string | undefined;
	/** The tenant id in the URL path. Might not match `effectiveTenantId` */
	urlTenantId: string | undefined;
	/** Whether we're in a tenant-scoped context */
	isMultiTenant: boolean;
	/** Switch to a different tenant (navigates to new tenant's home) */
	switchTenant: (newTenantId: string) => void;
	/** Clear tenant context (on logout) */
	clearTenant: () => void;
	/** Build a tenant-aware path for links and navigation */
	buildPath: (subPath?: string) => string;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
	children: ReactNode;
	/** Optional explicit tenant ID (overrides URL parsing) */
	tenantId?: string;
}

/**
 * TenantProvider extracts tenant from URL path and provides it to children.
 *
 * For path-based routing, the URL structure is:
 *   /id/{tenantId}/settings
 *   /id/{tenantId}/add
 *   /id/{tenantId}/cb?code=...
 *
 * The provider:
 * 1. Reads tenantId from URL params (useParams)
 * 2. Falls back to sessionStorage if not in URL
 * 3. Stores tenant in sessionStorage when found in URL
 */
export function TenantProvider({ children, tenantId: propTenantId }: TenantProviderProps) {
	// Get tenant from URL path parameter
	// This requires the route to be defined as /id/:tenantId/*
	const { tenantId: urlTenantId } = useParams<{ tenantId: string }>();

	// Note: With the /id/ prefix approach, default tenant uses root paths (/) and
	// custom tenants use /id/{tenantId}/* paths. No redirect needed for /default/*.

	// Get the already-stored tenant (from prior authentication)
	const storedTenantId = getStoredTenant();

	// Determine effective tenant ID:
	// - If user is already authenticated (has stored tenant), use stored tenant
	// - Otherwise, use prop > URL > storage as before
	const effectiveTenantId = storedTenantId || propTenantId || urlTenantId;

	// Only sync URL tenant to storage if:
	// 1. There's a URL tenant, AND
	// 2. No existing stored tenant (user is not yet authenticated)
	// This prevents an authenticated user from having their tenant overwritten
	// when they navigate to a different tenant's URL
	useEffect(() => {
		if (urlTenantId && !storedTenantId) {
			setStoredTenant(urlTenantId);
		}
	}, [urlTenantId, storedTenantId]);

	const switchTenant = useCallback((newTenantId: string) => {
		setStoredTenant(newTenantId);
		// Use full page reload instead of React navigation to ensure tenant-specific
		// config (potentially in index.html) is loaded fresh
		window.location.href = `/${TENANT_PATH_PREFIX}/${newTenantId}/`;
	}, []);

	const clearTenant = useCallback(() => {
		clearStoredTenant();
	}, []);

	const buildPath = useCallback((subPath?: string) => {
		return buildTenantRoutePath(effectiveTenantId, subPath);
	}, [effectiveTenantId]);

	const value = useMemo<TenantContextValue>(() => ({
		effectiveTenantId,
		urlTenantId,
		isMultiTenant: !!effectiveTenantId,
		switchTenant,
		clearTenant,
		buildPath,
	}), [effectiveTenantId, urlTenantId, switchTenant, clearTenant, buildPath]);

	return (
		<TenantContext.Provider value={value}>
			{children}
		</TenantContext.Provider>
	);
}

/**
 * Hook to access tenant context.
 * Must be used within a TenantProvider.
 */
export function useTenant(): TenantContextValue {
	const context = useContext(TenantContext);
	const { tenantId: urlTenantId } = useParams<{ tenantId: string }>();

	if (!context) {
		// Return a default context for components outside TenantProvider
		// This allows the app to work in single-tenant mode
		const storedTenant = getStoredTenant();
		return {
			effectiveTenantId: storedTenant,
			urlTenantId,
			isMultiTenant: false,
			switchTenant: () => {
				console.warn('switchTenant called outside TenantProvider');
			},
			clearTenant: clearStoredTenant,
			buildPath: (subPath?: string) => buildTenantRoutePath(storedTenant, subPath),
		};
	}
	return context;
}

/**
 * Hook to get tenant ID, throwing if not available.
 * Use this when tenant is required (e.g., in tenant-scoped routes).
 */
export function useRequiredTenant(): string {
	const { effectiveTenantId } = useTenant();
	if (!effectiveTenantId) {
		throw new Error('Tenant ID is required but not available. Ensure this component is within a tenant-scoped route (/id/:tenantId/*).');
	}
	return effectiveTenantId;
}
