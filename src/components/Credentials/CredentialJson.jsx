import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaCopy } from 'react-icons/fa';
import JsonViewer from '../JsonViewer/JsonViewer';

const CredentialJson = ({ parsedCredential }) => {
	const { t } = useTranslation();

	if (!parsedCredential?.signedClaims) return null;

	const handleCopy = (e) => {
		navigator.clipboard.writeText(
			JSON.stringify(parsedCredential.signedClaims, null, 2)
		);

		const container = e.target.closest('.json-container');
		if (container) {
			container.classList.remove('blur-[2px]');
			void container.offsetWidth;
			container.classList.add('blur-[2px]');
			setTimeout(() => container.classList.remove('blur-[2px]'), 200);
		}
	};

	return (
		<div className="w-full py-2 relative">
			<div className="json-container h-80 resize-y overflow-auto min-h-32 bg-white dark:bg-gray-800 dark:text-white border rounded p-2 text-sm rounded-xl transition filter duration-200 relative">
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
