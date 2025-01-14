// External libraries
import React, { useContext, useEffect, useState } from 'react';

// Context
import CredentialParserContext from '../../context/CredentialParserContext';

// Components
import Slider from '../Shared/Slider';
import CredentialImage from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';

const HistoryDetailContent = ({ historyItem }) => {
	const [currentSlide, setCurrentSlide] = React.useState(1);
	const [parsedCredentials, setParsedCredentials] = useState([]);
	const { parseCredential } = useContext(CredentialParserContext);

	// Parse all the credentials when historyItem changes
	useEffect(() => {
		const parseAllCredentials = async () => {
			const parsed = await Promise.all(
				historyItem.map(async (credential) => {
					const parsed = await parseCredential(credential);
					return parsed; // Store each parsed credential
				})
			);
			setParsedCredentials(parsed);
		};

		// Parse credentials on historyItem change
		if (historyItem.length > 0) {
			parseAllCredentials();
		}
	}, [historyItem, parseCredential]);

	const renderSlideContent = (parsedCredential, index) => (
		<div
			key={index}
			className="relative rounded-xl w-full transition-shadow shadow-md hover:shadow-lg"
			aria-label={parsedCredential.credentialFriendlyName}
			title={parsedCredential.credentialFriendlyName}
		>
			<CredentialImage parsedCredential={parsedCredential} showRibbon={false} className="w-full h-full rounded-xl" />
		</div>
	);

	return (
		<div className="py-2 w-full">
			<div className="px-2">
				<Slider
					items={parsedCredentials}
					renderSlideContent={renderSlideContent}
					onSlideChange={(currentIndex) => setCurrentSlide(currentIndex + 1)}
				/>
			</div>

			{/* Render details of the currently selected credential */}
			{parsedCredentials[currentSlide - 1] && (
				<div className="pt-5">
					<CredentialInfo parsedCredential={parsedCredentials[currentSlide - 1]} />
				</div>
			)}
		</div>
	);
};

export default HistoryDetailContent;
