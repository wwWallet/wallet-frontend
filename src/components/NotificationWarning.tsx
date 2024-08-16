import React, { useContext } from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { useSessionStorage } from '../components/useStorage';
import { Trans } from 'react-i18next';
import SessionContext from '../context/SessionContext';
import OnlineStatusContext from '../context/OnlineStatusContext';
import { notificationApiIsSupported } from '../firebase';


export default function NotificationWarning({
	isPermissionGranted,
	tokenSentInSession,
}: {
	isPermissionGranted: boolean | null,
	tokenSentInSession: boolean | null,
}): React.ReactNode {
	const { isOnline } = useContext(OnlineStatusContext);
	const { api } = useContext(SessionContext);
	const [isMessageNoGrantedVisible, setIsMessageNoGrantedVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageNoGrantedVisible', false));
	const [isMessageGrantedVisible, setIsMessageGrantedVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageGrantedVisible', false));
	const [isMessageOfflineVisible, setIsMessageOfflineVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageOfflineVisible', false));

	const handleCloseMessageOffline = () => {
		setIsMessageOfflineVisible(true);
	};

	const handleCloseMessageNoGranted = () => {
		setIsMessageNoGrantedVisible(true);
	};

	const handleCloseMessageGranted = () => {
		setIsMessageGrantedVisible(true);
	};

	const show = (
		(isOnline === false && isMessageOfflineVisible === false)
		|| (
			isOnline === true
			&& isPermissionGranted != null
			&& notificationApiIsSupported()
			&& (
				(!isPermissionGranted && isMessageNoGrantedVisible === false)
				|| (
					isPermissionGranted
					&& tokenSentInSession === false
					&& isMessageGrantedVisible === false)
			))
	);

	return (
		show
			? (
				<div className="bg-orange-100 shadow-lg p-4 rounded-lg mb-4 flex items-center">
					<div className="mr-4 text-orange-500">
						<FaExclamationTriangle size={24} />
					</div>

					{isOnline === false && isMessageOfflineVisible === false && (
						<>
							<div className="flex-grow">
								<p className='text-sm'>
									<Trans
										i18nKey="layout.messageOffline"
										components={{ strong: <strong /> }}
									/>
								</p>
							</div>
							<button
								className="ml-2 text-gray-800"
								onClick={handleCloseMessageOffline}
							>
								<FaTimes size={24} />
							</button>
						</>
					)}
					{isOnline === true && (
						<>
							{!isPermissionGranted && (
								<>
									<div className="flex-grow">
										<p className='text-sm'>
											<Trans
												i18nKey="layout.messageAllowPermission"
												components={{ strong: <strong /> }}
											/>
										</p>
									</div>
									<button
										className="ml-2 text-gray-800"
										onClick={handleCloseMessageNoGranted}
									>
										<FaTimes size={24} />
									</button>
								</>
							)}
							{isPermissionGranted && tokenSentInSession === false && (
								<>
									<div className="flex-grow">
										<p className='text-sm'>
											<Trans
												i18nKey="layout.messageResetPermission"
												components={{
													strong: <strong />,
													reloadButton: <button className='text-primary underline' onClick={() => window.location.reload()} />,
												}}
											/>
										</p>
									</div>
									<button
										className="ml-2 text-gray-800"
										onClick={handleCloseMessageGranted}
									>
										<FaTimes size={24} />
									</button>
								</>
							)}
						</>
					)}
				</div>
			)
			: <></>
	);
}
