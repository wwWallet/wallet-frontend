import React, { useContext, useMemo } from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import SessionContext from '@/context/SessionContext';
import { getStoredTenant, buildTenantRoutePath, isDefaultTenant, DEFAULT_TENANT_ID } from '@/lib/tenant';

const PrivateRoute = ({ children }: { children?: React.ReactNode }): React.ReactElement => {
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const cachedUsers = keystore.getCachedUsers();
	const location = useLocation();

	// Get tenant from URL (if in /:tenantId/* route)
	const { tenantId: urlTenantId } = useParams<{ tenantId: string }>();

	// Get the authenticated user's tenant from storage
	const storedTenantId = getStoredTenant();

	const queryParams = new URLSearchParams(window.location.search);
	const state = queryParams.get('state');

	const userExistsInCache = (state: string) => {
		if (!state) return false;
		try {
			const decodedState = JSON.parse(atob(state));
			return cachedUsers.some(user => user.userHandleB64u === decodedState.userHandleB64u);
		} catch (error) {
			console.error('Error decoding state:', error);
			return false;
		}
	};

	// Calculate redirect path for tenant enforcement
	const tenantRedirectPath = useMemo(() => {
		if (!isLoggedIn || !storedTenantId) {
			return null; // No redirect needed for unauthenticated users or no tenant
		}

		// Get the current sub-path within the tenant context
		const currentPath = location.pathname;
		let subPath = '';

		if (urlTenantId) {
			// In a tenant-scoped route: /:tenantId/settings → settings
			const tenantPrefix = `/${urlTenantId}`;
			if (currentPath.startsWith(tenantPrefix)) {
				subPath = currentPath.slice(tenantPrefix.length);
				if (subPath.startsWith('/')) subPath = subPath.slice(1);
			}
		} else {
			// In global route: /settings → settings
			subPath = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath;
		}

		// Scenario 1: Default tenant user at /default/* path → redirect to /
		if (isDefaultTenant(storedTenantId) && urlTenantId === DEFAULT_TENANT_ID) {
			const correctPath = buildTenantRoutePath(storedTenantId, subPath);
			return correctPath + location.search;
		}

		// Scenario 2: Non-default tenant user at global route (/) → redirect to /{tenantId}/
		if (!isDefaultTenant(storedTenantId) && !urlTenantId) {
			const correctPath = buildTenantRoutePath(storedTenantId, subPath);
			return correctPath + location.search;
		}

		// Scenario 3: User accessing wrong tenant (e.g., tenant A user at /B/)
		if (!isDefaultTenant(storedTenantId) && urlTenantId && urlTenantId !== storedTenantId) {
			const correctPath = buildTenantRoutePath(storedTenantId, subPath);
			return correctPath + location.search;
		}

		// Scenario 4: Default tenant user at non-default tenant path
		if (isDefaultTenant(storedTenantId) && urlTenantId && !isDefaultTenant(urlTenantId)) {
			const correctPath = buildTenantRoutePath(storedTenantId, subPath);
			return correctPath + location.search;
		}

		return null; // No redirect needed
	}, [isLoggedIn, storedTenantId, urlTenantId, location.pathname, location.search]);

	// Handle unauthenticated users first
	if (!isLoggedIn) {
		// For unauthenticated users, preserve the tenant from URL if present
		const loginTenantPath = urlTenantId && !isDefaultTenant(urlTenantId)
			? `/${urlTenantId}`
			: '';

		if (state && userExistsInCache(state)) {
			return <Navigate to={`${loginTenantPath}/login-state${window.location.search}`} replace />;
		} else {
			return <Navigate to={`${loginTenantPath}/login${window.location.search}`} replace />;
		}
	}

	// Enforce tenant-aware routing for authenticated users
	if (tenantRedirectPath) {
		return <Navigate to={tenantRedirectPath} replace />;
	}

	return (
		<>
			{children}
		</>
	);
};

export default PrivateRoute;
