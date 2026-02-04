import { useEffect, useState } from 'react'
import ExpiredRibbon from './ExpiredRibbon';
import UsagesRibbon from "./UsagesRibbon";
import DefaultCred from "../../assets/images/cred.png";
import { CredentialCardSkeleton } from '../Skeletons';

const CredentialImage = ({ vcEntity, className, onClick, showRibbon = true, vcEntityInstances = null, filter = null, onLoad, }) => {
	const [imageSrc, setImageSrc] = useState(undefined);

	useEffect(() => {
		let isMounted = true;

		async function loadImage() {
			const imageFn = vcEntity?.parsedCredential?.metadata?.credential?.image?.dataUri;
			if (!imageFn) {
				setImageSrc(DefaultCred);
				onLoad?.();
				return;
			}

			try {
				const uri = await (filter !== null ? imageFn(filter) : imageFn());
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
	}, [vcEntity, filter]);

	return (
		<>
			{vcEntity && imageSrc ? (
				<>
					<img src={imageSrc} alt={"Credential"} className={className} onClick={onClick} />
					{showRibbon &&
						<ExpiredRibbon vcEntity={vcEntity} />
					}
					{showRibbon &&
						<UsagesRibbon vcEntityInstances={vcEntityInstances} />
					}
				</>
			) : (
				<CredentialCardSkeleton />
			)}
		</>
	);
};

export default CredentialImage;
