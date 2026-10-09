import { useState, useEffect, useContext } from 'react';
import { compareBy, reverse } from '../util';

// Context
import CredentialsContext from '@/context/CredentialsContext';

import { CredentialVerificationError, VerifiableCredentialFormat } from 'wallet-common';
import type { CredentialVerifier, ParsedCredential } from 'wallet-common';
import type { LocalStorageKeystore } from '@/services/LocalStorageKeystore';
import type { CurrentSchema } from '@/services/WalletStateSchema';

type WalletStatePresentation = CurrentSchema.WalletStatePresentation;
type VerificationResult = Awaited<ReturnType<CredentialVerifier['verify']>>;

export interface PresentationHistoryItem {
	presentation: WalletStatePresentation;
	parsedCredential: ParsedCredential | null;
	result: VerificationResult | null;
	isExpired: boolean;
}

export type PresentationHistory = Record<number, PresentationHistoryItem[]>;
export type PresentationHistoryState = PresentationHistory | [] | null;

const useFetchPresentations = (
	keystore: LocalStorageKeystore,
	batchId: string | number | null | undefined = null,
	transactionId: string | null | undefined = null,
): PresentationHistoryState => {
	const [history, setHistory] = useState<PresentationHistoryState>(null);
	const { parseCredential, credentialEngine } = useContext(CredentialsContext);

	useEffect(() => {
		const fetchPresentations = async () => {
			console.log('FetchPresentations');
			try {
				let presentations = await keystore.getAllPresentations();
				if (!presentations || presentations.length === 0) {
					setHistory([]);
					return;
				}

				const allCredentials = (await keystore.getAllCredentials()) || [];
				const credentialById = new Map(
					allCredentials.map(c => [String(c.credentialId), c])
				);

				if (batchId !== null && batchId !== undefined && batchId !== '') {
					const parsedBatchId = typeof batchId === 'number' ? batchId : Number.parseInt(batchId, 10);
					const instances = allCredentials.filter((credential) => credential.batchId === parsedBatchId);
					const credentialsIds = instances.map((instance) => instance.credentialId);

					const transactionIds = presentations.filter((p) =>
						credentialsIds.reduce((acc, val) => acc || p.usedCredentialIds.includes(val), false)
					).map(p => p.transactionId);

					presentations = presentations.filter((p) =>
						transactionIds.includes(p.transactionId)
					);

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

						const firstUsedId = String(presentation.usedCredentialIds?.[0] ?? "");
						const firstVC = credentialById.get(firstUsedId);

						const parsedCredential = firstVC
							? await parseCredential({ ...firstVC, data: presentation.data })
							: null;

						const result = await (async () => {
							if (!credentialEngine) return null;

							switch (parsedCredential?.metadata?.credential?.format) {
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
							isExpired: result?.success === false && result.error === CredentialVerificationError.ExpiredCredential,
						};
					})
				);
				const presentationsGroupedByTransactionId = presentationsTransformed.reduce<PresentationHistory>((acc, p) => {
					acc[p.presentation.transactionId] = acc[p.presentation.transactionId] ? [...acc[p.presentation.transactionId], p] : [p];
					return acc;
				}, {});
				setHistory(presentationsGroupedByTransactionId);
			} catch (error) {
				console.error('Error fetching presentations:', error);
				setHistory([]);
			}
		};

		fetchPresentations();
	}, [keystore, batchId, transactionId, credentialEngine, parseCredential]);

	return history;
};

export default useFetchPresentations;
