import React, { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import useScreenType from '../../../hooks/useScreenType';

import Button from '../../../components/Buttons/Button';
import { Lock, LockOpen } from 'lucide-react';

const UnlockMainKey = ({
	onLock,
	onUnlock,
	onUnlockErrorChange,
	unlocked,
}: {
	onLock: () => void,
	onUnlock: () => void,
	onUnlockErrorChange: (error: string) => void,
	unlocked: boolean,
}) => {
	const { isOnline } = useContext(StatusContext);
	const { keystore } = useContext(SessionContext);
	const [inProgress, setInProgress] = useState(false);
	const { t } = useTranslation();
	const screenType = useScreenType();

	const onBeginUnlock = useCallback(
		async () => {
			onUnlockErrorChange('');
			setInProgress(true);
			try {
				await keystore.getPasswordOrPrfKeyFromSession(async () => true);
				onUnlock();
			} catch (e) {
				// Using a switch here so the t() argument can be a literal, to ease searching
				switch (e?.cause?.errorId) {
					case 'passkeyInvalid':
						onUnlockErrorChange(t('passkeyInvalid'));
						break;

					case 'passkeyLoginFailedTryAgain':
						onUnlockErrorChange(t('passkeyLoginFailedTryAgain'));
						break;

					default:
						throw e;
				}
			} finally {
				setInProgress(false);
			}
		},
		[keystore, onUnlock, onUnlockErrorChange, t],
	);

	return (
		<Button
			id={`${unlocked ? 'lock-passkey' : 'unlock-passkey'}-management-settings`}
			onClick={unlocked ? onLock : onBeginUnlock}
			variant="outline"
			disabled={inProgress || (!unlocked && !isOnline)}
			ariaLabel={!unlocked && !isOnline ? t("common.offlineTitle") : screenType !== 'desktop' && (unlocked ? t('pageSettings.lockSensitive') : t('pageSettings.unlockSensitive'))}
			title={!unlocked && !isOnline ? t("common.offlineTitle") : screenType !== 'desktop' && (unlocked ? t('pageSettings.lockSensitiveTitle') : t('pageSettings.unlockSensitiveTitle'))}
		>
			<div className="flex items-center">
				{unlocked
					? <>
						<LockOpen size={18} />
						<span className='hidden md:block ml-2'>
							{t('pageSettings.lockSensitive')}
						</span>
					</>
					: <>
						<Lock size={18} />
						<span className='hidden md:block ml-2'>
							{t('pageSettings.unlockSensitive')}
						</span>
					</>
				}
			</div>
		</Button>
	);
};

export default UnlockMainKey;
