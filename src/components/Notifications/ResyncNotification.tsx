// components/Notifications/ResyncNotification.tsx
import React, { useContext } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import SyncNotificationContext from '@/context/SyncNotificationContext';
import Button from '../Buttons/Button';
import { RefreshCw, X } from 'lucide-react';

function ResyncNotification(): React.ReactElement | null {
	useTranslation(); // This ensures reactivity to language changes
	const { t } = useTranslation();

	const { showSyncNotification, openAuthPopup, dismissSyncNotification } = useContext(SyncNotificationContext);

	return (
		showSyncNotification
			? (
				<div className="px-6 sm:px-12 w-full">
					<div className="bg-lm-orange-bg dark:bg-dm-orange-bg text-lm-gray-900 shadow-sm p-4 rounded-lg mb-4 flex items-center">
						<div className="mr-4">
							<RefreshCw size={24} />
						</div>
						<div className="grow">
							<p className='text-sm'>
								<Trans
									i18nKey="resyncNotification.description"
									components={{ strong: <strong /> }}
								/>
							</p>
						</div>
						<Button
							id="resync-notification-action"
							variant="outline"
							additionalClassName="ml-2"
							onClick={openAuthPopup}
						>
							{t('resyncNotification.action')}
						</Button>
						<button
							id="close-resync-notification"
							className="ml-2"
							onClick={dismissSyncNotification}
						>
							<X size={20} />
						</button>
					</div>
				</div>
			)
			: <></>
	);
}

export default ResyncNotification;
