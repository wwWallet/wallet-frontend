// StatusRibbon.js
import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import ContainerContext from '../../context/ContainerContext';
import {CheckExpired} from '../../functions/CheckExpired';

const StatusRibbon = ({ credential }) => {
	const { t } = useTranslation();

	const [parsedCredential, setParsedCredential] = useState(null);
	const container = useContext(ContainerContext);

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
			{parsedCredential && CheckExpired(parsedCredential.expiry_date) &&
				<div className={`absolute bottom-0 right-0 text-white text-xs py-1 px-3 rounded-tl-lg border-t-2 border-l-2 border-gray-200 dark:border-gray-800 ${CheckExpired(parsedCredential.expiry_date) && 'bg-red-600'}`}>
					{t('statusRibbon.expired')}
				</div>
			}
		</>
	);
};

export default StatusRibbon;
