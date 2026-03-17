import { cloneElement, ReactElement, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRightIcon } from 'lucide-react';
import SessionContext from '@/context/SessionContext';
import { getKnownTenants, KnownTenant, buildTenantRoutePath } from '@/lib/tenant';
import { fromBase64Url } from '@/util';
import PopupLayout from '../Popups/PopupLayout';
import Button from '../Buttons/Button';
import TenantMeta from './TenantMeta';

type TenantSelectorProps = {
	currentTenantId?: string;
	isAuthenticated: boolean;
	button?: ReactElement;
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

	const handleSelectTenant = async (tenantId: string) => {
		if (tenantId === currentTenantId) {
			return;
		}

		const tenant = knownTenants.find(t => t.id === tenantId);
		if (!tenant) {
			return;
		}

		const targetPath = buildTenantRoutePath(tenant.id, 'login');

		if (isAuthenticated) {
			// Logout first, then redirect
			await logout();
		}

		// Use full page reload to ensure clean state
		window.location.href = targetPath;
	};

	// Nothing to switch to
	if (!knownTenants.some(t => t.id !== currentTenantId)) {
		return;
	}

	const buttonElement = cloneElement(button, {
		id: 'tenant-selector-trigger',
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
						aria-label={t('tenantSelector.closePopup')}
					>
						<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
							<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
						</svg>
					</button>
				</div>
				{isAuthenticated && (
					<p className="mb-6 text-sm">
						{t('tenantSelector.switchDescription')}
					</p>
				)}
				<div>
					{knownTenants.some(t => t.id === currentTenantId) && (
						<>
							<h3 className="mb-2 font-semibold">{t('tenantSelector.currentTenantHeading')}</h3>
							<div className="p-2 w-full mb-2 flex justify-between gap-3">
								<TenantMeta knownTenants={knownTenants} tenantId={currentTenantId} />
							</div>
							<hr className="my-2 border-t border-lm-gray-400 dark:border-dm-gray-600" />
						</>
					)}
					<h3 className="mt-4 mb-2 font-semibold">{knownTenants.some(t => t.id === currentTenantId) ? t('tenantSelector.selectOtherTenant') : t('tenantSelector.selectTenant')}</h3>
					{knownTenants.filter((tenant) => tenant.id !== currentTenantId).map((tenant) => (
						<Button
							key={tenant.id}
							variant='outline'
							square
							additionalClassName="w-full mb-2 flex justify-between gap-3"
							onClick={() => handleSelectTenant(tenant.id)}
							title={tenant.id === currentTenantId ? t('tenantSelector.currentlySelected') : undefined}
						>
							<TenantMeta knownTenants={knownTenants} tenantId={tenant.id} />
							<ArrowRightIcon size={20} className="m-0.5 shrink-0" />
						</Button>
					))}
				</div>
			</PopupLayout>
		</>
	);
}
