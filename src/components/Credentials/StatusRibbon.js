// StatusRibbon.js
import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import ContainerContext from '../../context/ContainerContext';

const StatusRibbon = ({ credential }) => {
	const { t } = useTranslation();

	const [parsedCredential, setParsedCredential] = useState(null);

	const container = useContext(ContainerContext);

	const CheckExpired = (expDate) => {
		const today = new Date();
		const expirationDate = new Date(expDate);
		return expirationDate < today;
	};

	useEffect(() => {
		if (container) {
			container.credentialParserRegistry.parse(credential).then((c) => {
				if ('error' in c) {
					return;
				}
				setParsedCredential(c.beautifiedForm);
			});
		}

	}, [credential, container]);

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
