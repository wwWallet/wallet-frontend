import { useEffect, useState } from 'react'
import ExpiredRibbon from './ExpiredRibbon';
import UsagesRibbon from "./UsagesRibbon";
import DefaultCred from "../../assets/images/cred.png";
import { CredentialCardSkeleton } from '../Skeletons';

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
	const [imageSrc, setImageSrc] = useState(undefined);

	useEffect(() => {
		let isMounted = true;

		const svgPreference = {
			orientation: preferredOrientation,
		};

		async function loadImage() {
			const imageFn = vcEntity?.parsedCredential?.metadata?.credential?.image?.dataUri;
			if (!imageFn) {
				setImageSrc(DefaultCred);
				onLoad?.();
				return;
			}

			try {
				const uri = await imageFn(filter ?? undefined, ['en-US'], svgPreference);
				if (isMounted && uri) {
					setImageSrc(uri);
					onLoad?.();
				} else {
					setImageSrc(DefaultCred);
				}
			} catch (error) {
				console.warn('Failed to load credential image:', error);
				if (isMounted) {
					setImageSrc(DefaultCred);
					onLoad?.();
				}
			}
		}

		loadImage();

		return () => { isMounted = false };
	}, [vcEntity, filter, fixedRatio, onLoad, preferredOrientation]);

	return (
		<>
			{vcEntity && imageSrc ? (
				<>
					<div className={`relative w-full overflow-visible ${fixedRatio ? 'aspect-[1.6]' : ''}`}>
						<img
							src={imageSrc}
							alt="Credential"
							className={`w-full h-full w-full h-full object-cover object-top ${className ?? ''}`}
							onClick={onClick}
						/>
						{showRibbon &&
							<ExpiredRibbon vcEntity={vcEntity} borderColor={borderColor} />
						}
						{showRibbon &&
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
