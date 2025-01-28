import { useState, useEffect, useCallback } from 'react';

export const useVcEntity = (fetchVcData, vcEntityList, credentialId) => {
	const [vcEntity, setVcEntity] = useState(null);

	const fetchAndSetVcEntity = useCallback(async () => {
		try {
			if (vcEntityList) {
				const vcEntity = vcEntityList.find(
					(vcEntity) => vcEntity.credentialIdentifier === credentialId
				);
				if (!vcEntity) {
					throw new Error("Credential not found");
				}

				setVcEntity(vcEntity);
			} else {
				const vcEntityList = await fetchVcData(credentialId);
				setVcEntity(vcEntityList[0]);

			}
		} catch (err) {
			console.error('Error fetching VC entity:', err);
			setVcEntity(null); // Clear the state on error
		}
	}, [fetchVcData, vcEntityList, credentialId]);

	useEffect(() => {
		fetchAndSetVcEntity();
	}, [fetchAndSetVcEntity]);

	return vcEntity;
};
