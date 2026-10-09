import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { MetadataWarning } from 'wallet-common';

export interface ConsentPopupState<TOptions> {
	isOpen: boolean;
	options: TOptions | null;
	resolve: (value: boolean) => void;
	reject: () => void;
}

export type SetConsentPopupState<TOptions> = Dispatch<
	SetStateAction<ConsentPopupState<TOptions>>
>;

export interface TransactionConsentOptions {
	title?: ReactNode;
	attestations: Array<{
		heading: ReactNode;
		text: ReactNode;
	}>;
}

export interface IssuanceConsentOptions {
	title?: ReactNode;
	warnings: MetadataWarning[];
}
