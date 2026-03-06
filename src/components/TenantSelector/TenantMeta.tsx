import { SyntheticEvent, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { isDefaultTenant, KnownTenant, TENANT_PATH_PREFIX } from "@/lib/tenant";

export type TenantMetaProps = {
	knownTenants: KnownTenant[];
	tenantId: string;
}

export default function TenantMeta({ knownTenants, tenantId }: TenantMetaProps) {
	const { t } = useTranslation();

	const tenant = useMemo(() => knownTenants.find((t) => t.id === tenantId), [knownTenants, tenantId]);

	const faviconUrl = useMemo(() => {
			const basePath = isDefaultTenant(tenantId) ? '/' : `/${TENANT_PATH_PREFIX}/${tenantId}/`;
			return new URL('favicon.ico', window.location.origin + basePath).href;
	}, [tenantId]);

	const handleFaviconError = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
			const target = event.target as HTMLImageElement;
			const style = window.getComputedStyle(document.body);
			const brandColor = style.getPropertyValue('--theme-brand-color').trim() || '#000000';
			const initial = tenant?.displayName?.charAt(0).toUpperCase() || '';

			target.src = `data:image/svg+xml;base64,${btoa(`
					<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
							<rect width="100%" height="100%" fill="${brandColor}"/>
							<text x="50%" y="50%" font-size="20" fill="white" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif">${initial}</text>
					</svg>
			`)}`;
	}, [tenant]);

	if (!tenant) return null;

	return (
		<span className="flex items-center gap-3 w-full">
			<img src={faviconUrl} onError={handleFaviconError} alt={tenant.displayName || t('tenantSelector.defaultTenant')} className="w-10 h-10 border border-lm-gray-400 dark:border-dm-gray-600 rounded-lg"></img>
			<span className="flex flex-col items-start gap-0.5">
				<span className="text-base">
					{tenant.displayName || t('tenantSelector.defaultTenant')}
					</span>
				{tenant.userCount > 0 && (
					<span className="text-xs text-lm-gray-800 dark:text-dm-gray-200">({t('tenantSelector.userCount', { count: tenant.userCount })})</span>
				)}
			</span>
		</span>
	)
}
