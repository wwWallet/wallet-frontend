// External libraries
import React, { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Contexts
import SessionContext from '../../context/SessionContext';

// Components
import CredentialLayout from '../../components/Credentials/CredentialLayout';
import CredentialJson from '../../components/Credentials/CredentialJson';

const CredentialDetails = () => {
	const { credentialId } = useParams();
	const { api } = useContext(SessionContext);
	const [vcEntity, setVcEntity] = useState(null);
	const { t } = useTranslation();

	useEffect(() => {
		const getData = async () => {
			const response = await api.get('/storage/vc');
			const vcEntity = response.data.vc_list
				.filter((vcEntity) => vcEntity.credentialIdentifier === credentialId)[0];
			if (!vcEntity) {
				throw new Error("Credential not found");
			}
			console.log('details', vcEntity)
			setVcEntity(vcEntity);
		};

		getData();
	}, [api, credentialId]);

	return (
		<>
			<CredentialLayout title={t('pageCredentials.datasetTitle')}>
				{vcEntity && (
					<CredentialJson credential={vcEntity?.credential} textAreaRows='18'/>
				)}
			</CredentialLayout>

		</>
	);
};

export default CredentialDetails;
