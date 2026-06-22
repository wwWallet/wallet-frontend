import { useEffect, useState } from 'react'
import ExpiredRibbon from './ExpiredRibbon';
import UsagesRibbon from "./UsagesRibbon";
import DefaultCred from "../../assets/images/cred.png";
import { CredentialCardSkeleton } from '../Skeletons';
import { useTranslation } from 'react-i18next';
import { DISPLAY_CREDENTIAL_USAGES } from '@/config';

// Shared across all instances so e.g. the thumbnail and fullscreen popup reuse one resolution.
const resolvedImageCache = new Map();
const pendingImageRequests = new Map();

function getCacheKey(vcEntity, filter, preferredLangs, preferredOrientation) {
	const batchId = vcEntity?.batchId;
	if (batchId === undefined || batchId === null) return null;
	const filterKey = filter ? JSON.stringify(filter) : '';
	return `${batchId}|${filterKey}|${preferredLangs.join(',')}|${preferredOrientation}`;
}

const CredentialImage = ({
	vcEntity,
	className,
	onClick,
	showRibbon = true,
	vcEntityInstances = null,
	filter = null,
	onLoad,
	borderColor = undefined,
	fixedRatio = true,
	preferredOrientation = fixedRatio ? 'landscape' : 'portrait',
}) => {
	const { i18n } = useTranslation();
	const preferredLangs = i18n.languages;

	const imageFn = vcEntity?.parsedCredential?.metadata?.credential?.image?.dataUri;
	const cacheKey = imageFn ? getCacheKey(vcEntity, filter, preferredLangs, preferredOrientation) : null;
	const computeSrc = () => (!imageFn ? DefaultCred : (cacheKey ? resolvedImageCache.get(cacheKey) : undefined));

	const [resolved, setResolved] = useState(() => ({ key: cacheKey, src: computeSrc() }));

	// Resync during render (not in the effect) so a credential switch never shows the old image with the new ribbons.
	if (resolved.key !== cacheKey) {
		setResolved({ key: cacheKey, src: computeSrc() });
	}

	useEffect(() => {
		let isMounted = true;

		if (!imageFn) {
			onLoad?.();
			return;
		}

		if (cacheKey && resolvedImageCache.has(cacheKey)) {
			onLoad?.();
			return;
		}

		let request = cacheKey ? pendingImageRequests.get(cacheKey) : undefined;
		if (!request) {
			const svgPreference = { orientation: preferredOrientation };
			request = (async () => {
				try {
					const uri = await imageFn(filter ?? undefined, preferredLangs, svgPreference);
					return uri || DefaultCred;
				} catch (error) {
					console.warn('Failed to load credential image:', error);
					return DefaultCred;
				}
			})();

			if (cacheKey) {
				pendingImageRequests.set(cacheKey, request);
				request.then((uri) => {
					resolvedImageCache.set(cacheKey, uri);
					pendingImageRequests.delete(cacheKey);
				});
			}
		}

		request.then((uri) => {
			if (isMounted) {
				setResolved({ key: cacheKey, src: uri });
				onLoad?.();
			}
		});

		return () => { isMounted = false };
	}, [imageFn, cacheKey, filter, preferredLangs, preferredOrientation, onLoad]);

	const imageSrc = resolved.key === cacheKey ? resolved.src : undefined;

	return (
		<>
			{vcEntity && imageSrc ? (
				<>
					<div className={`relative w-full overflow-visible ${fixedRatio ? 'aspect-[1.6]' : ''}`}>
						<img
							src={imageSrc}
							alt="Credential"
							className={`w-full h-full object-cover object-top ${className ?? ''}`}
							onClick={onClick}
						/>
						{showRibbon &&
							<ExpiredRibbon vcEntity={vcEntity} borderColor={borderColor} />
						}
						{showRibbon && DISPLAY_CREDENTIAL_USAGES &&
							<UsagesRibbon vcEntityInstances={vcEntityInstances} borderColor={borderColor} />
						}
					</div>
				</>
			) : (
				<CredentialCardSkeleton />
			)}
		</>
	);
};

export default CredentialImage;
