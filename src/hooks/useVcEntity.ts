import { useState, useEffect, useCallback } from 'react';
import type { CredentialsContextValue, ExtendedVcEntity } from '@/context/CredentialsContext';

type FetchVcData = CredentialsContextValue['fetchVcData'];

export const useVcEntity = (
	fetchVcData: FetchVcData,
	vcEntityList: ExtendedVcEntity[] | null,
	batchId: string | null | undefined,
): ExtendedVcEntity | null | undefined => {
	const [vcEntity, setVcEntity] = useState<ExtendedVcEntity | null | undefined>(null);

	const fetchAndSetVcEntity = useCallback(async () => {
		try {
			const parsedBatchId = batchId == null ? undefined : parseInt(batchId);

			if (vcEntityList) {
				const matchingVcEntity = vcEntityList.find(
					(entity) => entity.batchId === parsedBatchId
				);
				if (!matchingVcEntity) {
					console.log("Credential not found");
					setVcEntity(undefined);
					return;
				}

				setVcEntity(matchingVcEntity);
			} else {
				const fetchedVcEntityList = await fetchVcData(parsedBatchId);
				setVcEntity(fetchedVcEntityList?.[0]);

			}
		} catch (err) {
			console.error('Error fetching VC entity:', err);
			setVcEntity(undefined); // Clear the state on error
		}
	}, [fetchVcData, vcEntityList, batchId]);

	useEffect(() => {
		fetchAndSetVcEntity();
	}, [fetchAndSetVcEntity]);

	return vcEntity;
};
