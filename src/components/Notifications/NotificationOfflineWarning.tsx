// components/Notifications/NotificationOfflineWarning.tsx
import React, { useContext } from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { useTranslation, Trans } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import { useSessionStorage } from '@/hooks/useStorage';

function NotificationOfflineWarning(): React.ReactElement | null {
	useTranslation(); // This ensures reactivity to language changes

	const { isOnline } = useContext(StatusContext);
	const { api } = useContext(SessionContext);
	const [isMessageOfflineVisible, setIsMessageOfflineVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageOfflineVisible', false));

	const handleCloseMessageOffline = () => {
		setIsMessageOfflineVisible(true);
	};

	const show = isOnline === false && isMessageOfflineVisible === false;
	if (!show) return null;

	return (
		show
			? (
				<div className="px-6 sm:px-12 w-full">
					<div className="bg-orange-100 shadow-lg p-4 rounded-lg mb-4 flex items-center">
						<div className="mr-4 text-orange-500">
							<FaExclamationTriangle size={24} />
						</div>

						{isOnline === false && isMessageOfflineVisible === false && (
							<>
								<div className="grow">
									<p className='text-sm text-gray-800'>
										<Trans
											i18nKey="layout.messageOffline"
											components={{ strong: <strong /> }}
										/>
									</p>
								</div>
								<button
									id="close-message-offline"
									className="ml-2 text-gray-800"
									onClick={handleCloseMessageOffline}
								>
									<FaTimes size={24} />
								</button>
							</>
						)}
					</div>
				</div>
			)
			: <></>
	);
}

export default NotificationOfflineWarning;
