// External libraries
import React, { useContext, useEffect, useState } from 'react';

// Context
import CredentialsContext from '@/context/CredentialsContext';

// Components
import Slider from '../Shared/Slider';
import CredentialImage from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';

import useScreenType from '../../hooks/useScreenType';

import { useHttpProxy } from '@/lib/services/HttpProxy/HttpProxy';
import { CredentialVerificationError } from "wallet-common/dist/error";
import { VerifiableCredentialFormat } from "wallet-common/dist/types";

const HistoryDetailContent = ({ historyItem }) => {
	const [currentSlide, setCurrentSlide] = React.useState(1);
	const [vcEntities, setVcEntities] = useState([]);
	const { parseCredential, credentialEngine } = useContext(CredentialsContext);
	const screenType = useScreenType();
	const httpProxy = useHttpProxy();
	// Parse all the credentials when historyItem changes
	useEffect(() => {
		const parseAllCredentials = async () => {
			Promise.all(
				historyItem.map(async (credential) => {
					const parsedCredential = await parseCredential(credential);

					const result = await (async () => {
						switch (parsedCredential.metadata.credential.format) {
							case VerifiableCredentialFormat.VC_SDJWT:
								return credentialEngine.sdJwtVerifier.verify({ rawCredential: credential, opts: {} });
							case VerifiableCredentialFormat.DC_SDJWT:
								return credentialEngine.sdJwtVerifier.verify({ rawCredential: credential, opts: {} });
							case VerifiableCredentialFormat.MSO_MDOC:
								return credentialEngine.msoMdocVerifier.verify({ rawCredential: credential, opts: {} });
							default:
								return null
						}
					})();

					const newVcEntity = {
						parsedCredential: parsedCredential,
						credential: credential,
						isExpired: result.success === false && result.error === CredentialVerificationError.ExpiredCredential,
					};
					setVcEntities((currentArray) => [...currentArray, newVcEntity]);
				})
			);
		};

		// Parse credentials on historyItem change
		if (historyItem.length > 0) {
			parseAllCredentials();
		}
	}, [historyItem, parseCredential, httpProxy, credentialEngine]);

	const renderSlideContent = (vcEntity, index) => (
		<div
			key={index}
			className="relative rounded-xl w-full transition-shadow shadow-md hover:shadow-lg"
			aria-label={vcEntity.parsedCredential.metadata.credential.name}
			title={vcEntity.parsedCredential.metadata.credential.name}
		>
			<CredentialImage vcEntity={vcEntity} showRibbon={false} className="w-full h-full rounded-xl" />
		</div>
	);

	return (
		<div className="py-2 w-full">
			<div className="px-2">
				<Slider
					items={vcEntities}
					renderSlideContent={renderSlideContent}
					onSlideChange={(currentIndex) => setCurrentSlide(currentIndex + 1)}
				/>
			</div>

			{/* Render details of the currently selected credential */}
			{vcEntities[currentSlide - 1] && (
				<div className={`pt-5 ${screenType !== 'mobile' ? 'overflow-y-auto items-center custom-scrollbar max-h-[30vh]' : ''} `}>
					<CredentialInfo parsedCredential={vcEntities[currentSlide - 1].parsedCredential} />
				</div>
			)}
		</div>
	);
};

export default HistoryDetailContent;
