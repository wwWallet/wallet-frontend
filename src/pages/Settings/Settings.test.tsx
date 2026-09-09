import React from 'react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SessionContext from '../../context/SessionContext';
import StatusContext from '../../context/StatusContext';
import Settings from './Settings';

const mocks = vi.hoisted(() => ({
	get: vi.fn(),
	post: vi.fn(),
	commit: vi.fn(),
	signalCurrentUserDetails: vi.fn(),
}));

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));
vi.mock('@/config', () => ({ APP_VERSION: 'test', WEBAUTHN_RPID: 'localhost' }));
vi.mock('@/util-webauthn', () => ({
	signalCurrentUserDetails: mocks.signalCurrentUserDetails,
	signalUnknownCredential: vi.fn(),
}));
vi.mock('../../services/keystore', () => ({
	serializePrivateData: () => 'private-data',
	isPrfKeyV2: () => true,
}));
vi.mock('wallet-common', () => ({ formatDate: (date: string) => date }));
vi.mock('../../hooks/useScreenType', () => ({ default: () => 'desktop' }));
vi.mock('../../components/LanguageSelector/LanguageSelector', () => ({ default: () => null }));
vi.mock('./components/SettingsTabs', () => ({ default: () => null }));
vi.mock('./components/WebauthnRegistration', () => ({ default: () => null }));
vi.mock('../../components/Popups/DeletePopup', () => ({
	default: ({ isOpen, onConfirm, onClose }: { isOpen: boolean, onConfirm: () => void, onClose: () => void }) => isOpen ? (
		<div role="dialog">
			<button onClick={onConfirm}>Confirm delete</button>
			<button onClick={onClose}>Cancel delete</button>
		</div>
	) : null,
}));

const credentials = [
	{ id: 'other', credentialId: new Uint8Array([2]), name: 'Other name', createTime: '2025-01-01', lastUseTime: '2025-01-02', backupEligibility: true, backupState: true, authenticatorName: 'Other authenticator' },
	{ id: 'current', credentialId: new Uint8Array([1]), name: 'Current name', createTime: '2025-02-01', lastUseTime: '2025-02-02', backupEligibility: true, backupState: true, authenticatorName: 'Current authenticator' },
];
const api = {
	get: mocks.get,
	post: mocks.post,
	getSession: () => ({ webauthnCredentialCredentialId: 'AQ' }),
	updatePrivateDataEtag: (response: unknown) => response,
};
const keystore = {
	getCalculatedWalletState: () => ({ settings: {} }),
	getPrfKeyInfo: () => null,
	deletePrf: () => [{}, mocks.commit],
};

function renderSettings(isOnline = true) {
	return render(
		<MemoryRouter initialEntries={['/settings?tab=account']}>
			<StatusContext.Provider value={{ isOnline } as React.ContextType<typeof StatusContext>}>
				<SessionContext.Provider value={{ api, keystore } as unknown as React.ContextType<typeof SessionContext>}>
					<Settings />
				</SessionContext.Provider>
			</StatusContext.Provider>
		</MemoryRouter>
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.get.mockResolvedValue({ data: { uuid: 'user', webauthnCredentials: credentials } });
	mocks.post.mockResolvedValue({ status: 204 });
});
afterEach(cleanup);

describe('Settings account passkeys', () => {
	it('places one name editor before the list and keeps status, deletion and credential details in the cards', async () => {
		renderSettings();
		const rename = await screen.findByRole('button', { name: 'pageSettings.passkeyItem.renameAriaLabel' });
		const list = screen.getByRole('list');
		expect(screen.getAllByRole('button', { name: 'pageSettings.passkeyItem.renameAriaLabel' })).toHaveLength(1);
		expect(list.contains(rename)).toBe(false);
		expect(rename.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		const rows = within(list).getAllByRole('listitem');
		expect(rows).toHaveLength(2);
		expect(within(rows[0]).getByText('pageSettings.passkeyItem.loggedIn')).toBeInTheDocument();
		expect(within(rows[0]).queryByRole('button', { name: 'pageSettings.passkeyItem.deleteAriaLabel' })).not.toBeInTheDocument();
		expect(within(rows[1]).getByRole('button', { name: 'pageSettings.passkeyItem.deleteAriaLabel' })).toBeInTheDocument();
		expect(within(list).getByText('Current authenticator')).toBeInTheDocument();
		expect(within(list).getByText('Other authenticator')).toBeInTheDocument();
		expect(within(list).getAllByText('pageSettings.passkeyItem.created')).toHaveLength(2);
		expect(within(list).queryByText('pageSettings.passkeyItem.name')).not.toBeInTheDocument();
	});

	it('renames all backend credentials with one request, then signals the authenticator', async () => {
		renderSettings();
		fireEvent.click(await screen.findByRole('button', { name: 'pageSettings.passkeyItem.renameAriaLabel' }));
		fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New name' } });
		fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
		await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
		expect(mocks.post).toHaveBeenCalledTimes(1);
		expect(mocks.post).toHaveBeenCalledWith('/user/session/webauthn/credentials/rename', { name: 'New name' });
		expect(mocks.signalCurrentUserDetails).toHaveBeenCalledWith(expect.objectContaining({ name: 'New name', displayName: 'New name' }));
	});

	it.each(['http', 'network'])('keeps editing and allows retry after a %s failure without signaling the authenticator', async (failure) => {
		if (failure === 'http') {
			mocks.post.mockResolvedValueOnce({ status: 500 });
		} else {
			mocks.post.mockRejectedValueOnce(new Error('Network failure'));
		}
		renderSettings();
		fireEvent.click(await screen.findByRole('button', { name: 'pageSettings.passkeyItem.renameAriaLabel' }));
		fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New name' } });
		fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('pageSettings.passkeyItem.renameFailed');
		expect(screen.getByRole('textbox')).toHaveValue('New name');
		expect(mocks.signalCurrentUserDetails).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
		await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
		expect(mocks.signalCurrentUserDetails).toHaveBeenCalledOnce();
	});

	it('waits for the backend before signaling or allowing another save', async () => {
		let complete: (response: { status: number }) => void;
		mocks.post.mockReturnValueOnce(new Promise(resolve => { complete = resolve; }));
		renderSettings();
		fireEvent.click(await screen.findByRole('button', { name: 'pageSettings.passkeyItem.renameAriaLabel' }));
		fireEvent.click(screen.getByRole('button', { name: 'common.save' }));
		expect(screen.getByRole('button', { name: 'common.save' })).toBeDisabled();
		expect(mocks.signalCurrentUserDetails).not.toHaveBeenCalled();
		complete({ status: 204 });
		await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
		expect(mocks.signalCurrentUserDetails).toHaveBeenCalledOnce();
	});

	it('cancels editing with Escape without submitting', async () => {
		renderSettings();
		const rename = await screen.findByRole('button', { name: 'pageSettings.passkeyItem.renameAriaLabel' });
		fireEvent.click(rename);
		fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Discard' } });
		fireEvent.keyUp(screen.getByRole('textbox'), { key: 'Escape' });
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'pageSettings.passkeyItem.renameAriaLabel' }));
		expect(screen.getByRole('textbox')).toHaveValue('Current name');
		expect(mocks.post).not.toHaveBeenCalled();
	});

	it('disables rename and deletion offline', async () => {
		renderSettings(false);
		expect(await screen.findByRole('button', { name: 'pageSettings.passkeyItem.renameAriaLabel' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'pageSettings.passkeyItem.deleteAriaLabel' })).toBeDisabled();
	});

	it('requires confirmation before deleting another passkey', async () => {
		renderSettings();
		fireEvent.click(await screen.findByRole('button', { name: 'pageSettings.passkeyItem.deleteAriaLabel' }));
		expect(mocks.post).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(mocks.post).toHaveBeenCalledWith('/user/session/webauthn/credential/other/delete', { privateData: 'private-data' });
		expect(mocks.commit).toHaveBeenCalledOnce();
	});
});
