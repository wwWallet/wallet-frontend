import { useState, useEffect } from 'react';
import { compareBy, reverse } from '../util';

const useFetchPresentations = (api, credentialId = "", historyId = "") => {
	const [history, setHistory] = useState([]);

	useEffect(() => {
		const fetchPresentations = async () => {
			console.log('FetchPresentations');
			try {
				const fetchedPresentations = await api.getAllPresentations();
				let vpListFromApi = fetchedPresentations.vp_list
					.sort(reverse(compareBy(vp => vp.issuanceDate)))
					.map((item) => ({
						id: item.id,
						presentation: item.presentation,
						ivci: item.includedVerifiableCredentialIdentifiers,
						audience: item.audience,
						issuanceDate: item.issuanceDate,
					}));

				if (credentialId) {
					vpListFromApi = vpListFromApi.filter(item =>
						item.ivci && item.ivci.includes(credentialId)
					);
				}

				if (historyId) {
					vpListFromApi = vpListFromApi.filter(item => item.id == historyId);
				}

				setHistory(Array.isArray(vpListFromApi) ? vpListFromApi : [vpListFromApi]);
			} catch (error) {
				console.error('Error fetching presentations:', error);
			}
		};

		fetchPresentations();
	}, [api, credentialId, historyId]);

	return history;
};

export default useFetchPresentations;
