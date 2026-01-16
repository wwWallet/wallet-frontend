/**
 * TenantContext - React context for multi-tenancy support.
 * 
 * The tenant ID can come from multiple sources (in order of precedence):
 * 1. URL path parameter (/:tenantId/*) - for path-based routing
 * 2. Explicitly passed tenantId prop - for components that know the tenant
 * 3. SessionStorage - cached from previous login/registration
 * 
 * Usage:
 *   // In App.tsx, wrap tenant-scoped routes:
 *   <Route path="/:tenantId/*" element={<TenantProvider><TenantRoutes /></TenantProvider>} />
 * 
 *   // In components:
 *   const { tenantId } = useTenant();
 *   api.signupWebauthn(name, keystore, ..., tenantId);
 * 
 * See go-wallet-backend/docs/adr/011-multi-tenancy.md for full design.
 */

import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStoredTenant, setStoredTenant, clearStoredTenant } from './tenant';

export interface TenantContextValue {
	/** Current tenant ID (from URL, prop, or storage) */
	tenantId: string | undefined;
	/** Whether we're in a tenant-scoped context */
	isMultiTenant: boolean;
	/** Switch to a different tenant (navigates to new tenant's home) */
	switchTenant: (newTenantId: string) => void;
	/** Clear tenant context (on logout) */
	clearTenant: () => void;
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
 *   /{tenantId}/settings
 *   /{tenantId}/add
 *   /{tenantId}/cb?code=...
 * 
 * The provider:
 * 1. Reads tenantId from URL params (useParams)
 * 2. Falls back to sessionStorage if not in URL
 * 3. Stores tenant in sessionStorage when found in URL
 */
export function TenantProvider({ children, tenantId: propTenantId }: TenantProviderProps) {
	const navigate = useNavigate();
	
	// Get tenant from URL path parameter
	// This requires the route to be defined as /:tenantId/*
	const { tenantId: urlTenantId } = useParams<{ tenantId: string }>();
	
	// Determine effective tenant ID (prop > URL > storage)
	const effectiveTenantId = propTenantId || urlTenantId || getStoredTenant();
	
	// Sync URL tenant to storage when available
	useEffect(() => {
		if (urlTenantId) {
			setStoredTenant(urlTenantId);
		}
	}, [urlTenantId]);
	
	const switchTenant = (newTenantId: string) => {
		setStoredTenant(newTenantId);
		navigate(`/${newTenantId}/`);
	};
	
	const clearTenant = () => {
		clearStoredTenant();
	};
	
	const value = useMemo<TenantContextValue>(() => ({
		tenantId: effectiveTenantId,
		isMultiTenant: !!effectiveTenantId,
		switchTenant,
		clearTenant,
	}), [effectiveTenantId]);
	
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
	if (!context) {
		// Return a default context for components outside TenantProvider
		// This allows the app to work in single-tenant mode
		return {
			tenantId: getStoredTenant(),
			isMultiTenant: false,
			switchTenant: () => {
				console.warn('switchTenant called outside TenantProvider');
			},
			clearTenant: clearStoredTenant,
		};
	}
	return context;
}

/**
 * Hook to get tenant ID, throwing if not available.
 * Use this when tenant is required (e.g., in tenant-scoped routes).
 */
export function useRequiredTenant(): string {
	const { tenantId } = useTenant();
	if (!tenantId) {
		throw new Error('Tenant ID is required but not available. Ensure this component is within a tenant-scoped route.');
	}
	return tenantId;
}
