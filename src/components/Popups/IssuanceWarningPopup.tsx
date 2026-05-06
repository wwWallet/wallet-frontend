import React from 'react';
import { useTranslation } from 'react-i18next';
import PopupLayout from './PopupLayout';
import Button from '../Buttons/Button';
import { CircleAlertIcon, ShieldAlertIcon, InfoIcon } from 'lucide-react';

export interface IssuanceWarning {
	code: string;
}

type WarningSeverity = 'critical' | 'warning' | 'info';

const CRITICAL_CODES = new Set([
	'JwtVcIssuerMismatch',
	'JwtVcIssuerFail',
]);

const WARNING_CODES = new Set([
	'IntegrityMissing',
	'IntegrityFail',
]);

function getSeverity(code: string): WarningSeverity {
	if (CRITICAL_CODES.has(code)) return 'critical';
	if (WARNING_CODES.has(code)) return 'warning';
	return 'info';
}

const severityConfig = {
	critical: {
		icon: ShieldAlertIcon,
		iconClass: 'text-lm-red dark:text-dm-red',
		bgClass: 'bg-red-50 dark:bg-red-950/30',
	},
	warning: {
		icon: CircleAlertIcon,
		iconClass: 'text-lm-orange dark:text-dm-orange',
		bgClass: 'bg-lm-gray-200 dark:bg-dm-gray-800',
	},
	info: {
		icon: InfoIcon,
		iconClass: 'text-lm-blue dark:text-dm-blue',
		bgClass: 'bg-lm-gray-200 dark:bg-dm-gray-800',
	},
} as const;

interface IssuanceWarningPopupProps {
	isOpen: boolean;
	warnings: IssuanceWarning[];
	onConfirm: () => void;
	onCancel: () => void;
}

const IssuanceWarningPopup: React.FC<IssuanceWarningPopupProps> = ({
	isOpen,
	warnings,
	onConfirm,
	onCancel,
}) => {
	const { t } = useTranslation();

	const sortedWarnings = [...warnings].sort((a, b) => {
		const order: Record<WarningSeverity, number> = {
			critical: 0,
			warning: 1,
			info: 2,
		};
		return order[getSeverity(a.code)] - order[getSeverity(b.code)];
	});

	return (
		<PopupLayout isOpen={isOpen} onClose={onCancel}>
			<div className="flex items-start justify-between mb-2">
				<h2 className="flex items-center text-lg font-bold text-lm-gray-900 dark:text-dm-gray-50">
					<div className="inline p-1 rounded-full mr-1 bg-lm-orange dark:bg-dm-orange text-white">
						<CircleAlertIcon size={20} />
					</div>
					{t('issuanceWarningPopup.title')}
				</h2>
			</div>
			<hr className="mb-2 border-t border-lm-gray-500 dark:border-dm-gray-500" />
			<p className="mt-4 text-sm text-lm-gray-900 dark:text-dm-gray-50">
				{t('issuanceWarningPopup.description')}
			</p>
			<ul className="mt-4 mb-2 space-y-2">
				{sortedWarnings.map((warning, index) => {
					const severity = getSeverity(warning.code);
					const config = severityConfig[severity];
					const Icon = config.icon;

					return (
						<li
							key={index}
							className={`flex items-start gap-2 p-2 rounded-md ${config.bgClass}`}
						>
							<Icon
								size={16}
								className={`mt-0.5 shrink-0 ${config.iconClass}`}
							/>
							<span className="text-sm font-medium text-lm-gray-900 dark:text-dm-gray-100">
								{t(`issuanceWarningPopup.codes.${warning.code}`, warning.code)}
							</span>
						</li>
					);
				})}
			</ul>
			<div className="flex justify-end space-x-2 pt-4">
				<Button id="cancel-issuance-warning" onClick={onCancel}>
					{t('common.reject')}
				</Button>
				<Button
					id="confirm-issuance-warning"
					variant="primary"
					onClick={onConfirm}
				>
					{t('common.accept')}
				</Button>
			</div>
		</PopupLayout>
	);
};

export default IssuanceWarningPopup;
