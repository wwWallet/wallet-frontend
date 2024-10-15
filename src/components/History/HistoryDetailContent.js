// External libraries
import React from 'react';
import { useTranslation } from 'react-i18next';

// Components
import Slider from '../Shared/Slider';
import CredentialImage from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';

const HistoryDetailContent = ({ historyItem }) => {
	const { t } = useTranslation();
	const [currentSlide, setCurrentSlide] = React.useState(1);

	const renderSlideContent = (credential) => (
		<div
			key={credential.id}
			className="relative rounded-xl w-full transition-shadow shadow-md hover:shadow-lg cursor-pointer"
			aria-label={credential.friendlyName}
			title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: credential.friendlyName })}
		>
			<CredentialImage credential={credential} className="w-full h-full rounded-xl" />
		</div>
	);

	return (
		<div className="py-2 w-full">
			<div className="px-2">
				<Slider
					items={historyItem}
					renderSlideContent={renderSlideContent}
					onSlideChange={(currentIndex) => setCurrentSlide(currentIndex + 1)}
				/>
			</div>

			{/* Render details of the currently selected credential */}
			{historyItem[currentSlide - 1] && (
				<CredentialInfo credential={historyItem[currentSlide - 1]} />
			)}
		</div>
	);
};

export default HistoryDetailContent;
