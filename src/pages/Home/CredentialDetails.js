// External libraries
import React, { useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Contexts
import SessionContext from '../../context/SessionContext';
import ContainerContext from '../../context/ContainerContext';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';

// Components
import CredentialLayout from '../../components/Credentials/CredentialLayout';
import CredentialJson from '../../components/Credentials/CredentialJson';

const CredentialDetails = () => {
	const { credentialId } = useParams();
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api, credentialId, null);
	const { t } = useTranslation();

	const container = useContext(ContainerContext);

	const [vcEntity, setVcEntity] = useState(null);
	const [credentialFiendlyName, setCredentialFriendlyName] = useState(null);

	useEffect(() => {
		const getData = async () => {
			const response = await api.get('/storage/vc');
			const vcEntity = response.data.vc_list
				.filter((vcEntity) => vcEntity.credentialId === credentialId)[0];
			if (!vcEntity) {
				throw new Error("Credential not found");
			}
			console.log('details',vcEntity)
			setVcEntity(vcEntity);
		};

		getData();
	}, [api, credentialId]);


	return (
		<>
			<CredentialLayout>
				{vcEntity && (
				<CredentialJson credential={vcEntity?.credential} />

				)}
			</CredentialLayout>

		</>
	);
};

export default CredentialDetails;
