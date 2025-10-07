// External libraries
import React, { useContext, useEffect, useState } from 'react';
import { VerifierIcon } from '@/assets/images/verifier_icon';

// Components
import Slider from '../Shared/Slider';
import CredentialImage from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';

import useScreenType from '../../hooks/useScreenType';

import { useHttpProxy } from '@/lib/services/HttpProxy/HttpProxy';
import { CredentialVerificationError } from "wallet-common/dist/error";
import { VerifiableCredentialFormat } from "wallet-common/dist/types";

import prettyDomain from '@/utils/prettyDomain';
import { formatDate } from '@/functions/DateFormat';

const HistoryDetailContent = ({ historyItem }) => {
	const [currentSlide, setCurrentSlide] = React.useState(1);
	const screenType = useScreenType();
	const httpProxy = useHttpProxy();

	const renderSlideContent = (vcEntity, index) => (
		<div
			key={index}
			className="relative rounded-xl w-full transition-shadow shadow-md hover:shadow-lg"
		>
			<CredentialImage vcEntity={vcEntity} showRibbon={false} className="w-full h-full rounded-xl" />
		</div>
	);

	return (
		<div className="py-2 w-full">
			<div className='flex items-center gap-2 px-2 mb-4'>
				<VerifierIcon size={40} className="text-white bg-primary dark:bg-primary-light p-2 rounded-md shrink-0" />
				<div>
					<p className='font-bold text-primary dark:text-white'>{prettyDomain(historyItem[0].presentation.audience)} </p>
					<p className='text-sm text-gray-700 dark:text-gray-300'>{formatDate(historyItem[0].presentation.presentationTimestampSeconds)}</p>
				</div>
			</div>
			<div>
				<Slider
					items={historyItem} // note: a HistoryItem is an array of presentations that happened in a single OpenID4VP transaction
					renderSlideContent={renderSlideContent}
					onSlideChange={(currentIndex) => setCurrentSlide(currentIndex + 1)}
					className='px-2'
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
