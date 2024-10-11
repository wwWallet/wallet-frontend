import { useState, useEffect } from 'react';
import { compareBy, reverse } from '../util';

const useFetchPresentations = (api, credentialIdentifiers = "") => {
	const [history, setHistory] = useState([]);

	useEffect(() => {
		const fetchPresentations = async () => {
			console.log('call fetchPresentations');
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

				if (credentialIdentifiers) {
					vpListFromApi = vpListFromApi.filter(item =>
						item.ivci && item.ivci.includes(credentialIdentifiers)
					);
				}

				setHistory(vpListFromApi);
			} catch (error) {
				console.error('Error fetching presentations:', error);
			}
		};

		fetchPresentations();
	}, [api, credentialIdentifiers]);

	return history;
};

export default useFetchPresentations;
