/**
 * TenantSelector - Dropdown component for switching between known tenants.
 *
 * Behavior:
 * - Unauthenticated (login page): Redirects to /id/{tenantId}/login
 * - Authenticated (sidebar): Triggers logout then redirects to /id/{tenantId}/login
 *
 * Derives tenant list from cachedUsers stored in localStorage.
 */

import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, ChevronDown, Check } from 'lucide-react';
import SessionContext from '@/context/SessionContext';
import { getKnownTenants, KnownTenant, buildTenantRoutePath, isDefaultTenant } from '@/lib/tenant';
import { fromBase64Url } from '@/util';

interface TenantSelectorProps {
	/** Currently active tenant ID */
	currentTenantId?: string;
	/** Whether user is authenticated (controls logout behavior) */
	isAuthenticated: boolean;
	/** Additional CSS classes */
	className?: string;
	/** Compact mode for mobile/header */
	compact?: boolean;
	/** Direction dropdown opens - 'up' for bottom placement, 'down' for top placement */
	openDirection?: 'up' | 'down';
	/** Full width mode - expands to fill parent container */
	fullWidth?: boolean;
}

export default function TenantSelector({
	currentTenantId,
	isAuthenticated,
	className = '',
	compact = false,
	openDirection = 'down',
	fullWidth = false,
}: TenantSelectorProps) {
	const { t } = useTranslation();
	const { keystore, logout } = useContext(SessionContext);
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Get known tenants from cached users
	const knownTenants = useMemo((): KnownTenant[] => {
		const cachedUsers = keystore.getCachedUsers();
		return getKnownTenants(cachedUsers, fromBase64Url);
	}, [keystore]);

	// Find current tenant info
	const currentTenant = useMemo(() => {
		if (!currentTenantId) return null;
		return knownTenants.find(t => t.id === currentTenantId) ?? {
			id: currentTenantId,
			displayName: undefined,
			userCount: 0,
		};
	}, [currentTenantId, knownTenants]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Handle tenant selection
	const handleSelectTenant = async (tenant: KnownTenant) => {
		if (tenant.id === currentTenantId) {
			setIsOpen(false);
			return;
		}

		// Build the target URL
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

	// Don't render if fewer than 2 tenants - nothing to switch to
	if (knownTenants.length < 2) {
		return null;
	}

	const getTenantLabel = (tenant: KnownTenant) => {
		if (tenant.displayName) {
			return tenant.displayName;
		}
		if (isDefaultTenant(tenant.id)) {
			return t('tenantSelector.defaultTenant', 'Default');
		}
		return tenant.id;
	};

	return (
		<div ref={dropdownRef} className={`relative ${fullWidth ? 'w-full' : ''} ${className}`}>
			{/* Trigger Button */}
			<button
				id="tenant-selector-trigger"
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={`
					flex items-center justify-between gap-2 px-3 py-2 rounded-lg
					bg-lm-gray-200 dark:bg-dm-gray-700
					hover:bg-lm-gray-300 dark:hover:bg-dm-gray-600
					border border-lm-gray-400 dark:border-dm-gray-600
					text-lm-gray-800 dark:text-dm-gray-200
					transition-colors duration-200
					${fullWidth ? 'w-full' : ''}
					${compact ? 'text-sm' : ''}
				`}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				aria-label={t('tenantSelector.selectTenant', 'Select tenant')}
			>
				<div className="flex items-center gap-2 min-w-0">
					<Building2 size={compact ? 16 : 18} className="shrink-0" />
					{!compact && (
						<span className="truncate">
							{currentTenant ? getTenantLabel(currentTenant) : t('tenantSelector.selectTenant', 'Select tenant')}
						</span>
					)}
				</div>
				<ChevronDown
					size={compact ? 14 : 16}
					className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
				/>
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div
					className={`
						absolute z-50 ${fullWidth ? 'w-full' : 'w-64'} max-h-64 overflow-y-auto
						bg-white dark:bg-dm-gray-800
						border border-lm-gray-300 dark:border-dm-gray-600
						rounded-lg shadow-lg
						${openDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}
						${compact && openDirection === 'down' ? 'right-0' : 'left-0'}
					`}
					role="listbox"
					aria-label={t('tenantSelector.tenantList', 'Available tenants')}
				>
					<div className="px-3 py-2 text-xs font-medium text-lm-gray-500 dark:text-dm-gray-400 border-b border-lm-gray-200 dark:border-dm-gray-700">
						{isAuthenticated
							? t('tenantSelector.switchTenant', 'Switch tenant (logout required)')
							: t('tenantSelector.selectTenantToLogin', 'Select tenant to login')
						}
					</div>

					<ul className="py-1">
						{knownTenants.map((tenant) => {
							const isSelected = tenant.id === currentTenantId;
							return (
								<li key={tenant.id}>
									<button
										id={`tenant-option-${tenant.id}`}
										type="button"
										onClick={() => handleSelectTenant(tenant)}
										className={`
											w-full flex items-center justify-between gap-2 px-3 py-2
											text-left text-sm
											hover:bg-lm-gray-100 dark:hover:bg-dm-gray-700
											${isSelected ? 'bg-lm-gray-50 dark:bg-dm-gray-750' : ''}
										`}
										role="option"
										aria-selected={isSelected}
									>
										<div className="flex flex-col min-w-0">
											<span className={`truncate ${isSelected ? 'font-medium' : ''}`}>
												{getTenantLabel(tenant)}
											</span>
											{tenant.userCount > 0 && (
												<span className="text-xs text-lm-gray-500 dark:text-dm-gray-400">
													{t('tenantSelector.userCount', { count: tenant.userCount, defaultValue: '{{count}} user(s)' })}
												</span>
											)}
										</div>
										{isSelected && (
											<Check size={16} className="shrink-0 text-lm-green dark:text-dm-green" />
										)}
									</button>
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</div>
	);
}
