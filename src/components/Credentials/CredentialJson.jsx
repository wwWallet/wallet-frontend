import React from 'react';
import { useTranslation } from 'react-i18next';
import JsonViewer from '../JsonViewer/JsonViewer';
import { Copy } from 'lucide-react';

const CredentialJson = ({ parsedCredential }) => {
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
			<div className="json-container h-80 resize-y overflow-auto min-h-32 bg-inherit text-inherit border border-lm-gray-400 dark:border-dm-gray-600 p-2 text-sm rounded-lg transition filter duration-200 relative">
				<button
					id="copy-dataset"
					onClick={handleCopy}
					title={t("pageCredentials.copyDatasetToClipboard")}
					aria-label={t("pageCredentials.copyDatasetToClipboard")}
					className="sticky float-right top-0 z-10 text-lm-gray-800 hover:text-lm-gray-700 dark:text-dm-gray-100 hover:dark:text-dm-gray-300 px-2 py-1"
				>
					<Copy size={18} />
				</button>
				<JsonViewer value={parsedCredential.signedClaims} />
			</div>
		</div>
	);
};

export default CredentialJson;
