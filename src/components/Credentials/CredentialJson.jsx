import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaCopy } from 'react-icons/fa';
import JsonViewer from '../JsonViewer/JsonViewer';

const CredentialJson = ({ parsedCredential, textAreaRows = '10' }) => {
	const { t } = useTranslation();

	if (!parsedCredential?.signedClaims) return null;

	const handleCopy = (e) => {
		navigator.clipboard.writeText(
			JSON.stringify(parsedCredential.signedClaims, null, 2)
		);

		const container = e.target.closest('.json-container');
		if (container) {
			container.classList.remove('animate-quick-blur');
			void container.offsetWidth;
			container.classList.add('animate-quick-blur');
		}
	};

	return (
		<div className="w-full py-2 relative">
			<div className="json-container h-80 resize-y overflow-auto min-h-32 bg-gray-100 dark:bg-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-sm transition filter duration-200 relative">
				<button
					id="copy-dataset"
					onClick={handleCopy}
					title={t("pageCredentials.copyDatasetToClipboard")}
					aria-label={t("pageCredentials.copyDatasetToClipboard")}
					className="sticky float-right top-0 z-10 text-primary-light hover:text-primary-light-hover dark:text-white hover:dark:text-gray-200 px-2 py-1"
				>
					<FaCopy size={18} />
				</button>
				<JsonViewer value={parsedCredential.signedClaims} />
			</div>
		</div>
	);
};

export default CredentialJson;
