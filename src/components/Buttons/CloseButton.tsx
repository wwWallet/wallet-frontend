import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import type { Props as ButtonProps } from './Button';

type CloseButtonProps = Omit<ButtonProps, 'ariaLabel' | 'children' | 'square' | 'variant'> & {
	ariaLabel?: string;
	iconSize?: number;
	tone?: 'default' | 'inherit';
};

const CloseButton = ({
	ariaLabel,
	iconSize = 20,
	size = 'md',
	tone = 'default',
	additionalClassName = '',
	...props
}: CloseButtonProps) => {
	const { t } = useTranslation();
	const toneClassName =
		tone === 'inherit'
			? '!text-inherit !bg-transparent enabled:hover:!bg-lm-gray-500/50 dark:enabled:hover:!bg-dm-gray-500/50'
			: '!bg-transparent enabled:hover:!bg-lm-gray-400 dark:enabled:hover:!bg-dm-gray-600';

	return (
		<Button
			{...props}
			size={size}
			variant="subtle"
			square={true}
			ariaLabel={ariaLabel ?? t('common.close')}
			additionalClassName={`shrink-0 !rounded-full ${toneClassName} ${additionalClassName}`}
		>
			<X size={iconSize} aria-hidden="true" />
		</Button>
	);
};

export default CloseButton;
