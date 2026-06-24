import React, { FormEvent, KeyboardEvent, useCallback, useContext, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';

import { WebauthnCredential } from '../../../api/types';
import { formatDate } from 'wallet-common';
import type { WebauthnPrfEncryptionKeyInfo } from '../../../services/keystore';
import { isPrfKeyV2 } from '../../../services/keystore';

import DeletePopup from '../../../components/Popups/DeletePopup';
import Button from '../../../components/Buttons/Button';
import { Edit, RefreshCcw, Trash2 } from 'lucide-react';

export function useWebauthnCredentialNickname(credential: WebauthnCredential): string {
	const { t } = useTranslation();
	if (credential) {
		return credential.nickname || `${t('pageSettings.passkeyItem.unnamed')} ${credential.id.substring(0, 8)}`;
	} else {
		return "";
	}
}

const WebauthnCredentialItem = ({
	credential,
	prfKeyInfo,
	isCurrent,
	onDelete,
	onRename,
	onUpgradePrfKey,
}: {
	credential: WebauthnCredential,
	prfKeyInfo: WebauthnPrfEncryptionKeyInfo,
	isCurrent?: boolean,
	onDelete?: false | (() => Promise<void>),
	onRename: (credential: WebauthnCredential, nickname: string | null) => Promise<boolean>,
	onUpgradePrfKey: (prfKeyInfo: WebauthnPrfEncryptionKeyInfo) => void,
}) => {
	const { isOnline } = useContext(StatusContext);
	const [nickname, setNickname] = useState(credential.nickname || '');
	const [editing, setEditing] = useState(false);
	const { t } = useTranslation();
	const currentLabel = useWebauthnCredentialNickname(credential);
	const [submitting, setSubmitting] = useState(false);
	const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const openDeleteConfirmation = () => setIsDeleteConfirmationOpen(true);
	const closeDeleteConfirmation = () => setIsDeleteConfirmationOpen(false);

	const handleDelete = async () => {
		if (onDelete) {
			setLoading(true);
			await onDelete(); // Wait for the delete function to complete
			setLoading(false);
			closeDeleteConfirmation();
		}
	};

	const onCancelEditing = useCallback(
		() => {
			setNickname(credential.nickname || '');
			setEditing(false);
		},
		[credential.nickname],
	);

	const onKeyUp = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Escape") {
				onCancelEditing();
			}
		},
		[onCancelEditing],
	);

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		try {
			const result = await onRename(credential, nickname);
			if (result) {
				setEditing(false);
			}
		} finally {
			setSubmitting(false);
		}
	};

	const needsPrfUpgrade = prfKeyInfo && !isPrfKeyV2(prfKeyInfo);

	return (
		<div className="mb-2 p-4 border border-lm-gray-300 dark:border-dm-gray-700 rounded-xl">
			<form onSubmit={onSubmit} className="flex flex-col gap-3">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-2 min-w-0">
						<span className="shrink-0 text-sm text-lm-gray-700 dark:text-dm-gray-300">
							{t('pageSettings.passkeyItem.nickname')}
						</span>
						{editing
							? (
								<input
									className="w-full text-sm max-w-56 px-3 py-1.5 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-600 dark:border-dm-gray-400 dark:text-white rounded-lg inputDarkModeOverride"
									type="text"
									placeholder={t('pageSettings.passkeyItem.nicknameInput')}
									value={nickname}
									onChange={(event) => setNickname(event.target.value)}
									aria-label={t('pageSettings.passkeyItem.nicknameInputAriaLabel', { passkeyLabel: currentLabel })}
									onKeyUp={onKeyUp}
									disabled={submitting}
									autoFocus
								/>
							)
							: (
								<p className="font-medium text-sm text-lm-gray-900 dark:text-white truncate">
									{currentLabel}
								</p>
							)
						}
						{!editing && isCurrent && (
							<span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-normal bg-lm-blue/5 text-lm-blue/70 dark:bg-dm-blue/50 dark:text-lm-gray-100">
								{t('pageSettings.passkeyItem.loggedIn')}
							</span>
						)}
					</div>

					<div className="flex gap-2 shrink-0">
						{editing
							? (
								<>
									<Button
										id="cancel-editing-settings"
										size="sm"
										onClick={onCancelEditing}
										disabled={submitting}
										ariaLabel={t('pageSettings.passkeyItem.cancelChangesAriaLabel', { passkeyLabel: currentLabel })}
									>
										{t('common.cancel')}
									</Button>
									<Button
										id="save-editing-settings"
										size="sm"
										type="submit"
										disabled={submitting}
										variant="primary"
									>
										{t('common.save')}
									</Button>
								</>
							)
							: (
								<Button
									id="rename-passkey"
									size="sm"
									variant="outline"
									onClick={() => setEditing(true)}
									disabled={!isOnline}
									aria-label={t('pageSettings.passkeyItem.renameAriaLabel', { passkeyLabel: currentLabel })}
									title={!isOnline ? t("common.offlineTitle") : ""}
								>
									<Edit size={14} />
									{t('pageSettings.passkeyItem.rename')}
								</Button>
							)
						}

						{onDelete && (
							<Button
								id="delete-passkey"
								size="sm"
								variant="delete"
								onClick={openDeleteConfirmation}
								disabled={!isOnline}
								aria-label={t('pageSettings.passkeyItem.deleteAriaLabel', { passkeyLabel: currentLabel })}
								title={!isOnline ? t("common.offlineTitle") : t("pageSettings.passkeyItem.deleteButtonTitleUnlocked", { passkeyLabel: currentLabel })}
							>
								<Trash2 size={14} />
								{t('common.delete')}
							</Button>
						)}
					</div>
				</div>

				<div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
					<div>
						<p className="text-sm text-lm-gray-700 dark:text-dm-gray-300">{t('pageSettings.passkeyItem.created')}</p>
						<p className="text-lm-gray-900 dark:text-white">{formatDate(credential.createTime)}</p>
					</div>
					<div>
						<p className="text-sm text-lm-gray-700 dark:text-dm-gray-300">{t('pageSettings.passkeyItem.lastUsed')}</p>
						<p className="text-lm-gray-900 dark:text-white">{formatDate(credential.lastUseTime)}</p>
					</div>
					<div>
						<p className="text-sm text-lm-gray-700 dark:text-dm-gray-300">{t('pageSettings.passkeyItem.canEncrypt')}</p>
						<p className="text-lm-gray-900 dark:text-white">
							{credential.prfCapable ? t('pageSettings.passkeyItem.canEncryptYes') : t('pageSettings.passkeyItem.canEncryptNo')}
						</p>
					</div>
				</div>

				{needsPrfUpgrade && (
					<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-lm-orange/10 dark:bg-dm-orange/10 border border-lm-orange/30 dark:border-dm-orange/30 px-3 py-2">
						<span className="text-sm text-lm-gray-900 dark:text-white">{t('pageSettings.passkeyItem.needsPrfUpgrade')}</span>
						<Button
							id="upgrade-prf-settings"
							size="sm"
							variant="outline"
							type="button"
							onClick={() => onUpgradePrfKey(prfKeyInfo)}
							aria-label={t('pageSettings.passkeyItem.prfUpgradeAriaLabel', { passkeyLabel: currentLabel })}
						>
							<RefreshCcw size={14} /> {t('pageSettings.passkeyItem.prfUpgrade')}
						</Button>
					</div>
				)}
			</form>

			<DeletePopup
				isOpen={isDeleteConfirmationOpen}
				onConfirm={handleDelete}
				onClose={closeDeleteConfirmation}
				message={
					<Trans
						i18nKey="pageSettings.passkeyItem.messageDeletePasskey"
						values={{ nickname: nickname }}
						components={{ strong: <strong /> }}
					/>
				}
				loading={loading}
			/>
		</div>
	);
};

export default WebauthnCredentialItem;
