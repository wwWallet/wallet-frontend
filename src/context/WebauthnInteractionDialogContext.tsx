import React, { createContext, useState } from 'react';

import Dialog from '../components/Dialog';
import Button from '../components/Buttons/Button';
import { useTranslation } from 'react-i18next';


export interface WebauthnDialog {
	beginGet(webauthnOptions: CredentialRequestOptions, dialogOptions: {
		bodyText: React.ReactNode,
	}): Promise<PublicKeyCredential>,

	error(options: {
		bodyText: React.ReactNode,
		buttons: {
			retry: boolean,
		},
	}): Promise<{ retry: boolean }>,

	success(options: {
		bodyText: React.ReactNode,
	}): Promise<void>,
}

type SetupFunction = (options: {
	heading: React.ReactNode,
}) => WebauthnDialog;

export type WebauthnInteractionDialogContextValue = {
	setup: SetupFunction,
};

const WebauthnInteractionDialogContext: React.Context<WebauthnInteractionDialogContextValue> = createContext({
	setup: () => { throw new Error('WebauthnInteractionDialogContext incorrectly initialized'); },
});


type WebauthnInteractionDialogProps = {
	bodyText: React.ReactNode,
	heading: React.ReactNode,
	onCancel: () => void,
	onClose?: () => void,
	onContinue?: () => void,
	onRetry?: () => void,
};
function WebauthnInteractionDialog({
	bodyText,
	heading,
	onCancel,
	onClose,
	onContinue,
	onRetry,
}: WebauthnInteractionDialogProps): React.ReactNode | null {
	const { t } = useTranslation();
	return (
		<Dialog
			open={true}
			onCancel={onCancel}
		>
			<h2 className="text-lg font-bold mb-2 text-primary dark:text-white">
				{heading}
			</h2>
			<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />

			<p className="mb-2 dark:text-white">{bodyText}</p>

			<div className="pt-2 flex justify-center gap-2">
				{onClose
					? <Button onClick={onClose}>
						{t('common.action-close')}
					</Button>
					: <Button onClick={onCancel}>
						{t('common.cancel')}
					</Button>
				}

				{onContinue
					? <Button variant="primary" onClick={onContinue}>
						{t('common.continue')}
					</Button>
					: <></>
				}

				{onRetry
					? <Button variant="primary" onClick={onRetry}>
						{t('common.tryAgain')}
					</Button>
					: <></>
				}
			</div>
		</Dialog>
	);
}

export const useWebauthnInteractionDialogContext = (): [WebauthnInteractionDialogContextValue, React.ReactNode | null] => {
	const [dialogState, setDialogState] = useState<WebauthnInteractionDialogProps | null>(null);
	const { t } = useTranslation();
	const resetState = () => {
		setDialogState(null);
	};

	const dialog = (
		dialogState
			? <WebauthnInteractionDialog {...dialogState} />
			: null
	);

	function abortError() {
		return new Error('Aborted by user', { cause: { id: 'user-abort' } });
	}

	const setup: SetupFunction = ({ heading }) => {
		return {
			async beginGet(webauthnOptions, { bodyText }) {
				await new Promise<void>((resolve, reject) => {
					setDialogState({
						heading,
						bodyText,
						onContinue: () => resolve(),
						onCancel: () => {
							reject(abortError());
							resetState();
						},
					});
				});
				const abortController = new AbortController();
				return new Promise(async (resolve, reject) => {
					setDialogState({
						heading,
						bodyText: t("Please interact with your authenticator..."),
						onCancel: () => {
							reject(abortError());
							resetState();
							abortController.abort();
						},
					});
					navigator.credentials.get({
						...webauthnOptions,
						signal: abortController.signal,
					})
						.then(cred => resolve(cred as PublicKeyCredential))
						.catch(reject);
				});
			},

			error({ bodyText, buttons }) {
				return new Promise((resolve, _reject) => {
					setDialogState({
						heading,
						bodyText,
						onCancel: () => {
							resolve({ retry: false });
							resetState();
						},
						onRetry: buttons.retry ? () => resolve({ retry: true }) : null,
					});
				});
			},

			success({ bodyText }) {
				return new Promise((resolve, _reject) => {
					const onCancel = () => {
						resolve();
						resetState();
					};
					setDialogState({
						heading,
						bodyText,
						onCancel,
						onClose: onCancel,
					});
				});
			},
		};
	};

	return [
		{ setup },
		dialog,
	];
};

export const WebauthnInteractionDialogContextProvider = ({ children }) => {
	const [ctx, dialog] = useWebauthnInteractionDialogContext();
	return (
		<>
			{
				dialog
					? dialog
					: <></>
			}
			<WebauthnInteractionDialogContext.Provider value={ctx}>
				{children}
			</WebauthnInteractionDialogContext.Provider>
		</>
	);
};

export const withWebauthnInteractionDialogContext: <P>(component: React.ComponentType<P>) => React.ComponentType<P> = (Component) =>
	(props) => (
		<WebauthnInteractionDialogContextProvider>
			<Component {...props} />
		</WebauthnInteractionDialogContextProvider>
	);

export default WebauthnInteractionDialogContext;
