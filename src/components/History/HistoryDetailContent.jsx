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
	const { parseCredential, credentialEngine } = useContext(CredentialsContext);
	const screenType = useScreenType();
	const httpProxy = useHttpProxy();

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
					items={historyItem} // note: a HistoryItem is an array of presentations that happened in a single OpenID4VP transaction
					renderSlideContent={renderSlideContent}
					onSlideChange={(currentIndex) => setCurrentSlide(currentIndex + 1)}
				/>
			</div>

			{/* Render details of the currently selected credential */}
			{historyItem[currentSlide - 1] && (
				<div className={`pt-5 ${screenType !== 'mobile' ? 'overflow-y-auto items-center custom-scrollbar max-h-[30vh]' : ''} `}>
					<CredentialInfo parsedCredential={historyItem[currentSlide - 1].parsedCredential} />
				</div>
			)}
		</div>
	);
};

export default HistoryDetailContent;
