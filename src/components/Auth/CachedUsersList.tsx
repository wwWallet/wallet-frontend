import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';

import type { CachedUser } from '../../services/LocalStorageKeystore';
import Button from '../Buttons/Button';
import Link from '../Links/Link';

const CachedUsersList = ({
	account,
	onSelect,
	onSwitchAccount,
	disabled = false,
}: {
	account: CachedUser;
	onSelect: (user: CachedUser) => void;
	onSwitchAccount: () => void;
	disabled?: boolean;
}) => {
	const { t } = useTranslation();
	const [pendingUserHandle, setPendingUserHandle] = useState<string | null>(null);

	const onSelectAccount = () => {
		setPendingUserHandle(account.userHandleB64u);
		onSelect(account);
	};

	return (
		<>
			<Button
				id="login-cached-user-0-loginsignup"
				variant="primary"
				onClick={onSelectAccount}
				disabled={disabled}
				ariaLabel={t('loginSignup.loginAsUser', { name: account.displayName })}
				title={t('loginSignup.loginAsUser', { name: account.displayName })}
				additionalClassName="w-full !justify-start !gap-3 !px-3 !py-2.5"
			>
				<div
					aria-hidden="true"
					className="w-8 h-8 rounded-full bg-white/25 text-white flex items-center justify-center shrink-0 select-none"
				>
					<User size={20} />
				</div>
				<div className="flex flex-col min-w-0 flex-1 text-left">
					<span className="text-xs text-white/80">
						{disabled && pendingUserHandle === account.userHandleB64u
							? t('loginSignup.submitting')
							: t('loginSignup.continueAs')}
					</span>
					<span className="text-sm font-semibold truncate">{account.displayName}</span>
				</div>
			</Button>

			<div className="text-sm flex justify-start pt-3">
				<Link onClick={onSwitchAccount} disabled={disabled}>
					{t('loginSignup.otherAccount')}
				</Link>
			</div>
		</>
	);
};

export default CachedUsersList;
