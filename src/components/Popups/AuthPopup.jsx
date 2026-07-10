import React, { useContext } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import PopupLayout from './PopupLayout';
import SessionContext from '@/context/SessionContext';
import { useLocation } from 'react-router-dom';
import { WebauthnLogin } from './SyncPopup';

const AuthPopup = ({ onClose }) => {
	const { t } = useTranslation();

	const { keystore } = useContext(SessionContext);
	const location = useLocation();

	const cachedUsers = keystore.getCachedUsers();

	const getFilteredUser = () => {
		const queryParams = new URLSearchParams(location.search);
		const user = queryParams.get('user');
		if (!user) {
			return null;
		}
		return cachedUsers.find((u) => u.userHandleB64u === user);
	};
	const filteredUser = getFilteredUser();

	if (!filteredUser) {
		return;
	}

	return (
		<PopupLayout isOpen={true} onClose={onClose} shouldCloseOnOverlayClick={false}>
			<div className="flex flex-col items-center text-center mb-2">
				<p className="font-bold text-xl mt-2 dark:text-dm-gray-100">
					{t('loginState.title')} {filteredUser.displayName}
				</p>
				<p className=" mb-2 mt-2 dark:text-dm-gray-100">
					<Trans
						i18nKey="authPopup.description"
						components={{ strong: <strong /> }}
					/>
				</p>
			</div>
			<WebauthnLogin
				filteredUser={filteredUser}
				onClose={onClose}
			/>
		</PopupLayout>
	);
};

export default AuthPopup;
