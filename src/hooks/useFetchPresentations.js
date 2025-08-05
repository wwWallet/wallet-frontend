import { useState, useEffect, useContext } from 'react';
import { compareBy, reverse } from '../util';

// Context
import CredentialsContext from '@/context/CredentialsContext';

import { CredentialVerificationError } from "wallet-common/dist/error";
import { VerifiableCredentialFormat } from "wallet-common/dist/types";

const useFetchPresentations = (keystore, batchId = null, transactionId = null) => {
	const [history, setHistory] = useState({});
	const { parseCredential, credentialEngine } = useContext(CredentialsContext);

	useEffect(() => {
		const fetchPresentations = async () => {
			console.log('FetchPresentations');
			try {
				let presentations = await keystore.getAllPresentations();
				if (presentations.length === 0) {
					setHistory([]);
					return;
				}

				if (batchId) {
					const credentials = await keystore.getAllCredentials() || [];
					const instances = credentials.filter((credential) => credential.batchId === parseInt(batchId));
					const credentialsIds = instances.map((instance) => instance.credentialId);

					const transactionIds = presentations.filter((p) =>
						credentialsIds.reduce((acc, val) => acc || p.usedCredentialIds.includes(val), false)
					).map(p => p.transactionId);

					presentations = presentations.filter((p) =>
						transactionIds.includes(p.transactionId)
					);
					console.log("Presentations = ", presentations)
					if (presentations.length === 0) {
						setHistory([]);
						return;
					}
				}

				if (transactionId) {
					presentations = presentations.filter((p) => p.transactionId === parseInt(transactionId));
					if (presentations.length === 0) {
						setHistory([]);
						return;
					}
				}

				const presentationsTransformed = await Promise.all(presentations
					.sort(reverse(compareBy(presentation => presentation.presentationTimestampSeconds)))
					.map(async (presentation) => {
						const parsedCredential = await parseCredential(presentation.data);
						const result = await (async () => {
							switch (parsedCredential.metadata.credential.format) {
								case VerifiableCredentialFormat.VC_SDJWT:
									return credentialEngine.sdJwtVerifier.verify({ rawCredential: presentation.data, opts: {} });
								case VerifiableCredentialFormat.DC_SDJWT:
									return credentialEngine.sdJwtVerifier.verify({ rawCredential: presentation.data, opts: {} });
								case VerifiableCredentialFormat.MSO_MDOC:
									return credentialEngine.msoMdocVerifier.verify({ rawCredential: presentation.data, opts: {} });
								default:
									return null;
							}
						})();

						return {
							presentation,
							parsedCredential,
							result,
							isExpired: result.success === false && result.error === CredentialVerificationError.ExpiredCredential,
						}
					})
				);
				const presentationsGroupedByTransactionId = presentationsTransformed.reduce((acc, p) => {
					acc[p.presentation.transactionId] = acc[p.presentation.transactionId] ? [...acc[p.presentation.transactionId], p] : [p];
					return acc;
				}, {});
				setHistory(presentationsGroupedByTransactionId);
			} catch (error) {
				console.error('Error fetching presentations:', error);
			}
		};

		fetchPresentations();
	}, [keystore, batchId, transactionId]);

	return history;
};

export default useFetchPresentations;
