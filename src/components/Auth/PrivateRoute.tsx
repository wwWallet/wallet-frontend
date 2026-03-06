import React, { useContext, useMemo, useEffect, useState } from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import SessionContext from '@/context/SessionContext';
import { getStoredTenant, buildTenantRoutePath, isDefaultTenant, TENANT_PATH_PREFIX } from '@/lib/tenant';

const PrivateRoute = ({ children }: { children?: React.ReactNode }): React.ReactElement => {
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const cachedUsers = keystore.getCachedUsers();
	const location = useLocation();
	const [isHardRedirecting, setIsHardRedirecting] = useState(false);

	// Get tenant from URL (if in /id/:tenantId/* route)
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
			// In a tenant-scoped route: /id/:tenantId/settings → settings
			const tenantPrefix = `/${TENANT_PATH_PREFIX}/${urlTenantId}`;
			if (currentPath.startsWith(tenantPrefix)) {
				subPath = currentPath.slice(tenantPrefix.length);
				if (subPath.startsWith('/')) subPath = subPath.slice(1);
			}
		} else {
			// In global route: /settings → settings
			subPath = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath;
		}

		// Redirect if URL tenant doesn't match authenticated user's tenant
		const urlMatchesStored = isDefaultTenant(storedTenantId)
			? !urlTenantId
			: urlTenantId === storedTenantId;

		if (!urlMatchesStored) {
			const correctPath = buildTenantRoutePath(storedTenantId, subPath);
			return correctPath + location.search;
		}

		return null; // No redirect needed
	}, [isLoggedIn, storedTenantId, urlTenantId, location.pathname, location.search]);

	// Handle cross-tenant hard redirects (full page reload)
	useEffect(() => {
		if (tenantRedirectPath) {
			setIsHardRedirecting(true);
			// Use full page reload to ensure tenant-specific config is loaded fresh
			window.location.href = tenantRedirectPath;
		}
	}, [tenantRedirectPath]);

	// Show nothing while doing a hard redirect
	if (isHardRedirecting) {
		return <></>;
	}

	// Handle unauthenticated users first
	if (!isLoggedIn) {
		// For unauthenticated users, preserve the tenant from URL if present
		const loginTenantPath = urlTenantId && !isDefaultTenant(urlTenantId)
			? `/${TENANT_PATH_PREFIX}/${urlTenantId}`
			: '';

		if (state && userExistsInCache(state)) {
			return <Navigate to={`${loginTenantPath}/login-state${window.location.search}`} replace />;
		} else {
			return <Navigate to={`${loginTenantPath}/login${window.location.search}`} replace />;
		}
	}

	return (
		<>
			{children}
		</>
	);
};

export default PrivateRoute;
