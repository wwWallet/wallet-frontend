import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2Icon, ChevronDownIcon } from 'lucide-react';
import SessionContext from '@/context/SessionContext';
import { getKnownTenants, KnownTenant, isDefaultTenant } from '@/lib/tenant';
import { fromBase64Url } from '@/util';

interface TenantSelectorProps {
	/** Currently active tenant ID */
	currentTenantId?: string;
	/** Whether user is authenticated (controls logout behavior) */
	isAuthenticated: boolean;
	/** Additional CSS classes */
	className?: string;
}

/**
 * TenantSelector - Dropdown component for switching between known tenants.
 *
 * Behavior:
 * - Unauthenticated (login page): Redirects to /id/{tenantId}/login
 * - Authenticated (sidebar): Triggers logout then redirects to /id/{tenantId}/login
 *
 * Derives tenant list from cachedUsers stored in localStorage.
 */
export default function TenantSelector({
	currentTenantId,
	isAuthenticated,
	className = '',
}: TenantSelectorProps) {
	const { t } = useTranslation();
	const { keystore, logout } = useContext(SessionContext);

	const knownTenants = useMemo((): KnownTenant[] => {
		const cachedUsers = keystore.getCachedUsers();
		return getKnownTenants(cachedUsers, fromBase64Url);
	}, [keystore]);

	const handleSelectTenant = async (tenantId: string) => {
		if (tenantId === currentTenantId) {
			return;
		}

		const tenant = knownTenants.find(t => t.id === tenantId);
		if (!tenant) {
			return;
		}

		const targetPath = isDefaultTenant(tenant.id)
			? '/login'
			: `/id/${tenant.id}/login`;

		if (isAuthenticated) {
			// Logout first, then redirect
			await logout();
		}

		// Use full page reload to ensure clean state
		window.location.href = targetPath;
	};

	// Nothing to switch to
	if (knownTenants.length < 2) {
		return;
	}

	const getTenantLabel = (tenant: KnownTenant) => {
		let label: string;
		if (tenant.displayName) {
			label = tenant.displayName;
		} else if (isDefaultTenant(tenant.id)) {
			label = t('tenantSelector.defaultTenant');
		} else {
			label = tenant.id;
		}

		if (tenant.userCount > 0) {
			label += ` (${t('tenantSelector.userCount', { count: tenant.userCount })})`;
		}

		return label;
	};

	return (
		<div className={className}>
			<div className="relative">
				<span className="absolute top-[50%] left-3 transform -translate-y-[50%] pointer-events-none">
					<Building2Icon size={14} />
				</span>
				<select
					id="tenant-selector"
					className="w-full h-8 px-8 text-sm bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-600 dark:border-dm-gray-400 dark:text-white rounded-lg dark:inputDarkModeOverride appearance-none"
					onChange={(e) => handleSelectTenant(e.target.value)}
					aria-label={t('tenantSelector.selectTenant')}
					title={t('tenantSelector.switchActiveTenant')}
				>
					<option value="" disabled selected hidden>
						{t('tenantSelector.selectTenant', 'Select tenant')}
					</option>
					{knownTenants.map((tenant) => (
						<option
							key={tenant.id}
							value={tenant.id}
							disabled={tenant.id === currentTenantId}
							title={tenant.id === currentTenantId && 'Currently selected'}
						>
							{getTenantLabel(tenant)}
						</option>
					))}
				</select>
				<span className="absolute right-2 top-[50%] transform -translate-y-[50%] pointer-events-none">
					<ChevronDownIcon size={18} />
				</span>
			</div>
		</div>
	);
}
