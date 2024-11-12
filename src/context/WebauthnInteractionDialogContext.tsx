import React, { createContext, useState } from 'react';

import { WebauthnInteractionEvent, WebauthnInteractionEventResponse } from '../webauthn';

import Dialog from '../components/Dialog';
import Button from '../components/Buttons/Button';
import { useTranslation } from 'react-i18next';


type MappedDialogState = {
	bodyText: React.ReactNode,
	buttons?: {
		cancel?: boolean,
		continue?: 'intro:ok' | 'success:ok',
		retry?: boolean,
	},
};

export type UiStateMachineFunction = (event: WebauthnInteractionEvent) => Promise<WebauthnInteractionEventResponse>;

type SetupFunction = (
	heading: React.ReactNode,
	mapState: (state: WebauthnInteractionEvent) => MappedDialogState,
) => UiStateMachineFunction;

export type WebauthnInteractionDialogContextValue = {
	setup: SetupFunction,
};

const WebauthnInteractionDialogContext: React.Context<WebauthnInteractionDialogContextValue> = createContext({
	setup: () => { throw new Error('WebauthnInteractionDialogContext incorrectly initialized'); },
});


type WebauthnInteractionDialogProps = MappedDialogState & {
	heading: React.ReactNode,
	resolveResponse: (response: WebauthnInteractionEventResponse) => void,
	onCancel: () => void,
	state: WebauthnInteractionEvent | null,
};
function WebauthnInteractionDialog({
	bodyText,
	buttons,
	heading,
	onCancel,
	resolveResponse,
	state,
}: WebauthnInteractionDialogProps): React.ReactNode | null {
	const { t } = useTranslation();

	if (state === null) {
		return null;
	} else {
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
					{buttons?.cancel ?? true
						? <Button onClick={onCancel}>
							{t('common.cancel')}
						</Button>
						: <></>
					}

					{buttons?.continue
						? <Button variant="primary" onClick={() => resolveResponse({ id: buttons.continue })}>
							{t('common.continue')}
						</Button>
						: <></>
					}

					{buttons?.retry
						? <Button variant="primary" onClick={() => resolveResponse({ id: 'retry' })}>
							{t('common.tryAgain')}
						</Button>
						: <></>
					}
				</div>
			</Dialog>
		);
	}
}

export const useWebauthnInteractionDialogContext = (): [WebauthnInteractionDialogContextValue, React.ReactNode | null] => {
	const [state, setState] = useState<WebauthnInteractionEvent>(null);
	const [heading, setHeading] = useState(null);
	const [mapDialogState, setMapDialogState] = useState<(state: WebauthnInteractionEvent) => MappedDialogState>(null);
	const [resolveResponse, setResolveResponse] = useState<(response: WebauthnInteractionEventResponse) => void>(null);
	const resetState = () => {
		setHeading(null);
		setMapDialogState(null);
		setResolveResponse(null);
		setState(null);
	};

	const onCancel = () => {
		if (resolveResponse) {
			resolveResponse("err" in state ? { id: 'cancel', cause: state.err } : { id: 'cancel' });
		}
		resetState();
	};

	const dialog = (
		mapDialogState && state
			? <WebauthnInteractionDialog
				heading={heading} {...mapDialogState(state)}
				resolveResponse={resolveResponse}
				onCancel={onCancel}
				state={state}
			/>
			: null
	);

	const setup: SetupFunction = (heading, mapState) => async (event: WebauthnInteractionEvent) => {
		setHeading(heading);
		setMapDialogState(() => mapState);
		return new Promise<WebauthnInteractionEventResponse>((resolve, reject) => {
			switch (event.id) {
				case 'webauthn-begin':
					navigator.credentials.get(event.webauthnArgs)
						.then(pkc => resolve({ id: 'webauthn-begin:ok', credential: pkc as PublicKeyCredential }))
						.catch(e => {
							setState({ id: 'err', err: e });
							return Promise.reject(e);
						})
						;
					setState(event);
					setResolveResponse(() => resolve);
					break;

				case 'success:dismiss':
					resetState();
					break;

				default:
					setState(event);
					setResolveResponse(() => resolve);
			}
		});
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
