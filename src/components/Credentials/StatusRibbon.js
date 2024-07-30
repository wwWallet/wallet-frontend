// StatusRibbon.js
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseCredential } from '../../functions/parseCredential';

const StatusRibbon = ({ credential }) => {
	const { t } = useTranslation();

	const [parsedCredential, setParsedCredential] = useState(null);

	const CheckExpired = (expDate) => {
		const today = new Date();
		const expirationDate = new Date(expDate);
		return expirationDate < today;
	};

	useEffect(() => {
		parseCredential(credential).then((c) => {
			setParsedCredential(c);
		});
	}, [credential]);

	return (
		<>
			{parsedCredential && CheckExpired(parsedCredential.expirationDate) &&
				<div className={`absolute bottom-0 right-0 text-white text-xs py-1 px-3 rounded-tl-lg border-t border-l border-white ${CheckExpired(parsedCredential.expirationDate) ? 'bg-red-500' : 'bg-green-500'}`}>
					{ t('statusRibbon.expired') }
				</div>
			}
		</>
	);
};

export default StatusRibbon;
