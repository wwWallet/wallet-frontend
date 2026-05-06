import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { jsonToLog, logger } from '@/logger';
import { OIDFlowError } from '@/lib/openid-flow/errors';
import { OIDFlowCallbackURL, OIDFlowProgressEvent } from '@/lib/openid-flow/types/OIDFlowTypes';
import useErrorDialog from '@/hooks/useErrorDialog';
import useOID4VCIFlow from '@/hooks/useOID4VCIFlow';
import OpenID4VPContext from '@/context/OpenID4VPContext';
import useOID4VPFlow from '@/hooks/useOID4VPFlow';
import { useTxCodeInput } from '@/context/TxCodeInputContext';
import { TxCodeInputPopup } from '@/components/Popups/TxCodeInputPopup';
import MessagePopup from '@/components/Popups/MessagePopup';
import Spinner from '@/components/Shared/Spinner';
import { useOIDFlowTransport } from '@/context/OIDFlowTransportContext';
import { useTenant } from '@/context/TenantContext';
import { parseOIDFlowCallbackUrl } from '@/lib/openid-flow/utils/oidFlowCallbackUrl';
import IssuanceWarningPopup from '@/components/Popups/IssuanceWarningPopup';

type OpenIDFlowCallbackProps = {
	callbackUrl: OIDFlowCallbackURL;
}

type OpenIDFlowCallbackHandler = React.FC<OpenIDFlowCallbackProps>;

/**
 * OpenIDFlowCallback - Transient page that processes OID4VCI/OID4VP callback URLs.
 *
 * Route: /cb/* (wrapped in <PrivateRoute>
 *
 * Renders a spinner while the flow runs, then navigates home on completion or error.
 * The effect fires once when transportReady becomes true (guarded by flowIsActive ref
 * to prevent double-invocation in StrictMode).
 *
 * Auth & sync:
 * - Authentication is enforced by PrivateRoute (see App.jsx) — unauthenticated users
 *   are redirected to login before this component mounts.
 * - Session sync is handled by UriHandlerProvider (see AppProvider.tsx), which wraps
 *   this component. The sync completes before transportReady settles in practice,
 *   but there is no explicit sync gate here. If sync timing becomes an issue,
 *   extract synced state from UriHandlerProvider into a shared context.
 */
const OpenIDFlowCallback: React.FC = () => {
	const { transportReady } = useOIDFlowTransport();
	/**
	 * Parse the callback URL on initial load to determine the flow type and relevant parameters.
	 */
	const callbackUrl: OIDFlowCallbackURL = useMemo(() => {
		const url = new URL(window.location.href);

		return parseOIDFlowCallbackUrl(url);
	}, []);

	return (
		<>
			<Spinner/>
			{transportReady && <OpenIDFlowRouter callbackUrl={callbackUrl} />}
		</>
	);
};

/**
 * Based on the callback url, route to the appropriate flow handler component.
 * The handler components are responsible for executing the protocol flow,
 * handling errors, and navigating home on completion.
 */
const OpenIDFlowRouter: OpenIDFlowCallbackHandler = ({ callbackUrl }) => {
	const { buildPath } = useTenant();

	const resolved = useMemo(() => {
		switch (callbackUrl.protocol) {
			case 'oid4vci':
				return { handler: OpenID4VCIFlow };
			case 'oid4vp':
				return { handler: OpenID4VPFlow };
			case 'unknown':
				return { handler: OpenIDUnknownFlow };
			default:
				return null
		}
	}, [callbackUrl]);

	if (resolved && 'handler' in resolved) {
		const Handler = resolved.handler;
		return <Handler callbackUrl={callbackUrl} />;
	}

	// If no handler found, we assume the user isn't meant to be here,
	// and redirect to home.
	return <Navigate to={buildPath()} />;
}

/**
 * OpenID4VCIFlow - Handles OID4VCI credential offer and authorization code callbacks.
 */
const OpenID4VCIFlow: OpenIDFlowCallbackHandler = ({ callbackUrl }) => {
	const { displayError } = useErrorDialog();
	const { t } = useTranslation();
	const {
		requestTxCode,
		state: txCodeState,
		handleSubmit: handleTxCodeSubmit,
		handleCancel: handleTxCodeCancel,
	} = useTxCodeInput();
	const navigateHome = useNavigateHome();
	const [warningState, setWarningState] = useState<{ isOpen: boolean; warnings: Array<{ code: string }> }>({ isOpen: false, warnings: [] });
	const warningResolverRef = useRef<((proceed: boolean) => void) | null>(null);
	const flowIsActive = useRef(false);

	const handleError = useCallback(
		(err: Error) => {
			logger.error('Error in OID4VCI flow:', err);
			displayError({
				title: t('openIdCallback.vciFlowError.title'),
				description: err instanceof Error ? err.message : String(err),
				onClose: () => navigateHome(),
			});
		},
		[displayError, navigateHome, t],
	);

	const handleProgress = useCallback((event: OIDFlowProgressEvent) => {
		logger.debug('OID4VCI flow progress:', event);
	}, []);

	const handleIssuanceWarnings = useCallback(
		async (warnings: Array<{ code: string }>) => {
			logger.warn('Credential issuance warnings:', jsonToLog(warnings));

			return new Promise<boolean>((resolve) => {
				warningResolverRef.current = resolve;
				setWarningState({
					isOpen: true,
					warnings,
				});
			});
		},
		[],
	);

	const {
		handleCredentialOffer,
		requestWithPreAuthorization,
		handleAuthorizationResponse,
		handleReceivedCredentials,
	} = useOID4VCIFlow({
		onError: handleError,
		onProgress: handleProgress,
		onIssuanceWarnings: handleIssuanceWarnings,
	});

	const processCredentialOffer = async (url: URL) => {
		const offer = await handleCredentialOffer(url);
		logger.debug('Received credential offer:', offer);

		cleanupUrl();

		if (offer.success && offer.credentials?.length) {
			await handleReceivedCredentials(
				offer.credentials,
				offer.credentialIssuerIdentifier,
				offer.selectedCredentialConfigurationId,
			);
		}

		if (offer.authorizationUrl) {
			window.location.href = offer.authorizationUrl;
			return;
		}

		if (!offer.preAuthorizedCode) return;

		let txCodeInput: string | undefined;
		if (offer.txCode) {
			try {
				txCodeInput = await requestTxCode({
					description: offer.txCode.description ?? undefined,
					length: offer.txCode.length ?? undefined,
					inputMode:
						offer.txCode.inputMode === 'numeric' ? 'numeric' : 'text',
				});
			} catch {
				logger.info('User cancelled transaction code input');
				return;
			}
		}

		const preAuthResult = await requestWithPreAuthorization(
			offer.preAuthorizedCode,
			txCodeInput,
		);

		if (preAuthResult.success && preAuthResult.credentials?.length) {
			await handleReceivedCredentials(
				preAuthResult.credentials,
				preAuthResult.credentialIssuerIdentifier,
				preAuthResult.selectedCredentialConfigurationId,
			);
		}
	};

	const processAuthorizationCode = async (url: URL) => {
		const code = url.searchParams.get('code');
		const state = url.searchParams.get('state');

		cleanupUrl();

		const result = await handleAuthorizationResponse(code, state);

		if (result.success && result.credentials?.length) {
			await handleReceivedCredentials(
				result.credentials,
				result.credentialIssuerIdentifier,
				result.selectedCredentialConfigurationId,
			);
		}
	};

	const handleWarningConfirm = useCallback(() => {
		warningResolverRef.current?.(true);
		warningResolverRef.current = null;
		setWarningState({ isOpen: false, warnings: [] });
	}, []);

	const handleWarningCancel = useCallback(() => {
		warningResolverRef.current?.(false);
		warningResolverRef.current = null;
		setWarningState({ isOpen: false, warnings: [] });
	}, []);

	useEffect(() => {
		if (flowIsActive.current) return;
		flowIsActive.current = true;

		if (callbackUrl.protocol !== 'oid4vci') return;

		(async () => {
			try {
				switch (callbackUrl.type) {
					case 'credential_offer':
						await processCredentialOffer(callbackUrl.url);
						break;
					case 'authorization_code':
						await processAuthorizationCode(callbackUrl.url);
						break;
					default:
						throw new OIDFlowError({
							code: 'UNSUPPORTED_CALLBACK',
							message: 'Unsupported callback type',
						});
				}

				navigateHome();
			} catch (error) {
				logger.error('Error in OID4VCI flow:', error);
				displayError({
					title: t('openIdCallback.vciFlowError.title'),
					description: error instanceof Error ? error.message : String(error),
					onClose: () => navigateHome(),
				});
			}
		})();
		// One-shot flow: runs once on mount, guarded by flowIsActive ref.
		// All deps are stable at mount time. Re-running would restart the protocol flow.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<IssuanceWarningPopup
				isOpen={warningState.isOpen}
				warnings={warningState.warnings}
				onConfirm={handleWarningConfirm}
				onCancel={handleWarningCancel}
			/>
			<TxCodeInputPopup
				isOpen={txCodeState.isOpen}
				txCodeConfig={txCodeState.config}
				onSubmit={handleTxCodeSubmit}
				onCancel={() => {
					handleTxCodeCancel();
					navigateHome();
				}}
			/>
		</>
	);
};

/**
 * OpenID4VPFlow - Handles OID4VP presentation request callbacks.
 */
const OpenID4VPFlow: OpenIDFlowCallbackHandler = ({ callbackUrl }) => {
	const { displayError } = useErrorDialog();
	const { t } = useTranslation();
	const { showCredentialSelectionPopup, showTransactionDataConsentPopup } = useContext(OpenID4VPContext);
	const [successMessage, setSuccessMessage] = useState<{ title: string; description: string } | null>(null);
	const navigateHome = useNavigateHome();
	const flowIsActive = useRef(false);

	/**
	 * Handle errors thrown during OID4VP flows.
	 */
	const handleOID4VPError = useCallback((err: Error) => {
		logger.error("Error in OID4VP flow:", err);
		if (!(err instanceof OIDFlowError)) {
			displayError({
				title: t('openIdCallback.vpFlowError.title'),
				description: err.message,
			});
			return;
		}

		switch (err.code.toUpperCase()) {
			case 'INSUFFICIENT_CREDENTIALS':
				displayError({
					title: t('openIdCallback.insufficientCredentials.title'),
					description: t('openIdCallback.insufficientCredentials.description'),
				});
				return;
			case 'NONTRUSTED_VERIFIER':
				displayError({
					title: t('openIdCallback.nonTrustedVerifier.title'),
					description: t('openIdCallback.nonTrustedVerifier.description'),
				});
				return;
			default:
				displayError({
					title: t('openIdCallback.vpFlowError.title'),
					description: err.message,
				});
				return;
		}
	}, [displayError, t]);

	/**
	 * Handle OID4VP flow progress events.
	 * For now, just debug logging.
	 */
	const handleOID4VPProgress = useCallback((event: OIDFlowProgressEvent) => {
		logger.debug("OID4VP flow progress:", event);
	}, []);

	/**
	 * Handle credential selection during OID4VP flows by showing the configured UI and returning the user's selection.
	 */
	const handleOID4VPCredentialSelection = useCallback(async (
		conformantCredentialsMap: Record<string, {
			credentials: number[];
			requestedFields: Array<{
				name?: string;
			}>;
		}>,
		verifierDomainName: string,
		verifierPurpose: string,
	) => {
		logger.debug("Prompting for credential selection...", { conformantCredentialsMap, verifierDomainName, verifierPurpose });

		if (!showCredentialSelectionPopup) {
			throw new Error('No credential selection popup configured');
		}

		const selection = await showCredentialSelectionPopup(
			conformantCredentialsMap,
			verifierDomainName,
			verifierPurpose,
		);

		logger.debug("User selection:", selection);

		return selection;
	}, [showCredentialSelectionPopup]);

	const {
		handleAuthorizationRequest,
		handleCredentialSelection,
		sendAuthorizationResponse,
	} = useOID4VPFlow({
		onError: handleOID4VPError,
		onProgress: handleOID4VPProgress,
		onCredentialSelection: handleOID4VPCredentialSelection,
	});

	const processAuthorizationRequest = async (url: URL) => {
		const result = await handleAuthorizationRequest(url);

		cleanupUrl();

		if (!result?.success) {
			return; // Hook already called onError with the proper error dialog
		}

		logger.debug('Authorization request result:', result);

		if (result.transactionData?.length) {
			const consented = await showTransactionDataConsentPopup({
				title: 'Transaction Data',
				attestations: result.transactionData.map((td) => td.data),
			});

			if (!consented) return;
		}

		const credSelectResult = await handleCredentialSelection(
			result.verifierInfo,
			result.dcqlQuery,
			result.conformantCredentials,
		);

		if (!credSelectResult?.success) {
			if (credSelectResult?.error?.code === 'USER_CANCELLED') return;
			throw new OIDFlowError(credSelectResult.error);
		}

		const sendResult = await sendAuthorizationResponse(
			credSelectResult.selectedCredentials,
		);
		logger.debug('Authorization response sent:', sendResult);

		if (sendResult.success) {
			setSuccessMessage({
				title: t('openIdCallback.sendResponseSuccess.title'),
				description: t('openIdCallback.sendResponseSuccess.description'),
			});
		}

		if ('redirectUri' in sendResult) {
			window.location.href = sendResult.redirectUri;
		}
	};

	useEffect(() => {
		if (flowIsActive.current) return;
		flowIsActive.current = true;

		if (callbackUrl.protocol !== 'oid4vp') return;

		(async () => {
			try {
				switch (callbackUrl.type) {
					case 'presentation_request':
						await processAuthorizationRequest(callbackUrl.url);
						break;
					default:
						throw new OIDFlowError({
							code: 'UNSUPPORTED_CALLBACK',
							message: 'Unsupported callback type',
						});
				}

				navigateHome();
			} catch (error) {
					logger.error('Error in OID4VP flow:', error);
				displayError({
					title: t('openIdCallback.vpFlowError.title'),
					description: error instanceof Error ? error.message : String(error),
					onClose: () => navigateHome(),
				});
			}
		})();
		// One-shot flow: runs once on mount, guarded by flowIsActive ref.
		// All deps are stable at mount time. Re-running would restart the protocol flow.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			{successMessage && (
				<MessagePopup
					type="success"
					onClose={() => {
						setSuccessMessage(null);
						navigateHome();
					}}
					message={successMessage}
				/>
			)}
		</>
	);
};

/**
 * OpenIDUnknownFlow - Handles unsupported or error callbacks by showing an error message.
 */
const OpenIDUnknownFlow: OpenIDFlowCallbackHandler = ({ callbackUrl }) => {
	const { displayError } = useErrorDialog();
	const { t } = useTranslation();
	const navigateHome = useNavigateHome();

	useEffect(
		() => {
			if (callbackUrl.type === 'authorization_error') {
				const error = callbackUrl.url.searchParams.get('error');
				const desc = callbackUrl.url.searchParams.get('error_description');

				logger.error('Authorization error in OpenID flow callback:', error, desc);
				displayError({
					title: error
						? `${t('openIdCallback.authorizationError.title')}: ${error}`
						: t('openIdCallback.authorizationError.title'),
					description: desc ?? '',
					onClose: () => navigateHome(),
				});
				return;
			}

			logger.error('Unsupported OpenID flow callback received:', callbackUrl.url.href);
			displayError({
				title: t('openIdCallback.unsupportedCallback.title'),
				description: t('openIdCallback.unsupportedCallback.description'),
				onClose: () => navigateHome(),
			});
		},
		// Only run once on mount. The callbackUrl is stable for the lifetime of this component, and re-running would cause duplicate error popups.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	return <></>;
}

const useNavigateHome = () => {
	const navigate = useNavigate();
	const { buildPath } = useTenant();

	return useCallback(() => {
		navigate(buildPath());
	}, [navigate, buildPath]);
};

function cleanupUrl() {
	window.history.replaceState({}, '', window.location.origin + window.location.pathname);
}

export default OpenIDFlowCallback;
