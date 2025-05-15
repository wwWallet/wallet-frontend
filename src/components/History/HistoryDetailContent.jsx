import React, { useContext, useEffect, useState } from 'react';
import { VerifiableCredentialFormat } from "wallet-common/dist/types";
import { CredentialVerificationError } from "wallet-common/dist/error";

import CredentialParserContext from '@/context/CredentialParserContext';

import useScreenType from '@/hooks/useScreenType';

import { useHttpProxy } from '@/lib/services/HttpProxy/HttpProxy';
import { initializeCredentialEngine } from '@/lib/initializeCredentialEngine';

import Slider from '@/components/Shared/Slider';
import CredentialImage from '@/components/Credentials/CredentialImage';
import CredentialInfo from '@/components/Credentials/CredentialInfo';

const HistoryDetailContent = ({ historyItem }) => {
	//General
	const httpProxy = useHttpProxy();
	const screenType = useScreenType();
	const { parseCredential } = useContext(CredentialParserContext);

	//State
	const [vcEntities, setVcEntities] = useState([]);
	const [currentSlide, setCurrentSlide] = useState(1);

	// Parse all the credentials when historyItem changes
	useEffect(() => {
		const parseAllCredentials = async () => {
			Promise.all(
				historyItem.map(async (credential) => {
					const parsedCredential = await parseCredential(credential);
					const credentialEngine = await initializeCredentialEngine(httpProxy);

					const result = await (async () => {
						switch (parsedCredential.metadata.credential.format) {
							case VerifiableCredentialFormat.VC_SDJWT:
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
	}, [historyItem, parseCredential, httpProxy]);

	// Handlers
	const renderSlideContent = (vcEntity, index) => (
		<div
			key={index}
			className="relative rounded-xl w-full"
			aria-label={vcEntity.parsedCredential.metadata.credential.name}
			title={vcEntity.parsedCredential.metadata.credential.name}
		>
			<CredentialImage vcEntity={vcEntity} showRibbon={false} className="w-full h-full rounded-xl" supportHover={false} />
		</div>
	);

	// Render
	return (
		<div className="w-full">
			<div className="">
				<Slider
					items={vcEntities}
					renderSlideContent={renderSlideContent}
					onSlideChange={(currentIndex) => setCurrentSlide(currentIndex + 1)}
				/>
			</div>

			{/* Render details of the currently selected credential */}
			{vcEntities[currentSlide - 1] && (
				<div className='mt-4 border-t border-c-lm-gray-400 dark:border-c-dm-gray-600 pt-2 -mb-2'>
					<CredentialInfo parsedCredential={vcEntities[currentSlide - 1].parsedCredential} fullWidth={true} />
				</div>
			)}
		</div>
	);
};

export default HistoryDetailContent;
