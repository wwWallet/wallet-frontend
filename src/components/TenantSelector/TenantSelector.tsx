import React, { SyntheticEvent, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleCheckIcon, CircleIcon } from 'lucide-react';
import SessionContext from '@/context/SessionContext';
import { getKnownTenants, KnownTenant, isDefaultTenant } from '@/lib/tenant';
import { fromBase64Url } from '@/util';
import PopupLayout from '../Popups/PopupLayout';
import Button from '../Buttons/Button';

interface TenantSelectorProps {
	/** Currently active tenant ID */
	currentTenantId?: string;
	/** Whether user is authenticated (controls logout behavior) */
	isAuthenticated: boolean;
	/** Custom toggle element */
	button?: React.ReactElement;
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
	button = <Button variant="link" />,
}: TenantSelectorProps) {
	const { t } = useTranslation();
	const { keystore, logout } = useContext(SessionContext);
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const handleOpen = () => {
		setIsOpen(true);
	};

	const handleClose = () => {
		setIsOpen(false);
	};

	const knownTenants = useMemo((): KnownTenant[] => {
		const cachedUsers = keystore.getCachedUsers();
		return getKnownTenants(cachedUsers, fromBase64Url);
	}, [keystore]);

	const favicon = 'favicon.ico';
	const tenantFavicons = useMemo(() => {
		const favicons: Record<string, string> = {};

		for (const tenant of knownTenants) {
			const url = isDefaultTenant(tenant.id) ? '/' : `/id/${tenant.id}/`;
			favicons[tenant.id] = new URL(favicon, window.location.origin + url).href;
		}

		return favicons;
	}, [knownTenants]);

	const generateFaviconFallback = useCallback((event: SyntheticEvent<HTMLImageElement>, id: string) => {
		const target = event.target as HTMLImageElement;
		event.preventDefault();

		const style = window.getComputedStyle(document.body);
		const brandColor = style.getPropertyValue('--theme-brand-color').trim() || '#000000';
		const name = knownTenants.find(t => t.id === id)?.displayName?.charAt(0).toUpperCase() || '';

		target.src = `data:image/svg+xml;base64,${btoa(`
			<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
				<rect width="100%" height="100%" fill="${brandColor}"/>
				<text x="50%" y="50%" font-size="20" fill="white" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif">${name}</text>
			</svg>
		`)}`;
	}, [knownTenants]);

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

	const buttonElement = React.cloneElement(button, {
		onClick: handleOpen,
		'aria-expanded': isOpen,
		'aria-haspopup': 'dialog',
		children: button.props.children || t('tenantSelector.label'),
	});

	return (
		<>
			{buttonElement}
			<PopupLayout padding="p-4 md:p-8" isOpen={isOpen} onClose={handleClose}>
				<div className="flex items-start justify-between mb-4" role="dialog" aria-modal="true" aria-labelledby="switch-tenant-title">
					<h2 id="switch-tenant-title" className="flex items-center text-lg font-bold text-lm-gray-900 dark:text-dm-gray-50 pr-6">
						{t('tenantSelector.switchActiveTenant')}
					</h2>
					<button
						id="dismiss-switch-tenant-popup"
						type="button"
						className="md:absolute top-6 right-6 text-lm-gray-900 dark:text-dm-gray-100 bg-transparent hover:bg-lm-gray-400 dark:hover:bg-dm-gray-600 transition-all rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center"
						onClick={handleClose}
						aria-label="Close popup"
					>
						<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
							<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
						</svg>
					</button>
				</div>
				<p className="mb-6">{t('tenantSelector.description')}</p>
				<ul>
					{knownTenants.map((tenant) => (
						<Button
							key={tenant.id}
							variant='outline'
							square
							additionalClassName={`w-full mb-2 flex justify-between gap-3 ${tenant.id === currentTenantId && 'dark:border-lm-gray-200'}`}
							onClick={() => handleSelectTenant(tenant.id)}
							disabled={tenant.id === currentTenantId}
							title={tenant.id === currentTenantId ? t('tenantSelector.currentlySelected') : undefined}
						>
							<span className="flex items-center gap-3 w-full">
								<img src={tenantFavicons[tenant.id]} onError={(event) => generateFaviconFallback(event, tenant.id)} alt={tenant.displayName || t('tenantSelector.defaultTenant')} className="w-10 h-10 border border-lm-gray-400 dark:border-dm-gray-600 rounded-lg"></img>
								<span className="flex flex-col items-start gap-0.5">
									<span className="text-base">
										{tenant.displayName || t('tenantSelector.defaultTenant')}
										</span>
									{tenant.userCount > 0 && (
										<span className="text-xs text-lm-gray-800 dark:text-dm-gray-200">({t('tenantSelector.userCount', { count: tenant.userCount })})</span>
									)}
								</span>
							</span>
							{(() => {
								const Icon = tenant.id === currentTenantId ? CircleCheckIcon : CircleIcon;
								return <Icon size={30} className="m-0.5 shrink-0 text-brand-base dark:text-dm-gray-200" />;
							})()}
						</Button>
					))}
				</ul>
			</PopupLayout>
		</>
	);
}
