import { useState, useEffect, useCallback } from 'react';

export const useVcEntity = (fetchVcData, vcEntityList, vcEntityListInstances = null, credentialId) => {
	const [vcEntity, setVcEntity] = useState(null);
	const [vcEntityInstances, setVcEntityInstances] = useState(null);

	const fetchAndSetVcEntity = useCallback(async () => {
		try {
			if (vcEntityList && vcEntityListInstances) {
				const vcEntity = vcEntityList.find(
					(vcEntity) => vcEntity.credentialIdentifier === credentialId
				);
				if (!vcEntity) {
					throw new Error("Credential not found");
				}
				const vcEntityInstances = vcEntityListInstances.filter(
					(vc) => vc.credentialIdentifier === credentialId
				);

				if (!vcEntityInstances) {
					throw new Error("Credential not found");
				}

				setVcEntity(vcEntity);
				setVcEntityInstances(vcEntityInstances);
			} else {
				const { vcEntityList, fetchedVcList } = await fetchVcData(credentialId);
				setVcEntity(vcEntityList[0]);
				setVcEntityInstances(fetchedVcList);

			}
		} catch (err) {
			console.error('Error fetching VC entity:', err);
			setVcEntity(null); // Clear the state on error
			setVcEntityInstances(null)
		}
	}, [fetchVcData, vcEntityList, vcEntityListInstances, credentialId]);

	useEffect(() => {
		fetchAndSetVcEntity();
	}, [fetchAndSetVcEntity]);

	return { vcEntity, vcEntityInstances };
};
