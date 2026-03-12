import { Trans, useTranslation } from 'react-i18next';
import { POWERED_BY } from '@/config';

interface PoweredByProps {
	className?: string;
	linkClassName?: string;
}

const DEFAULT_NAME = 'wwWallet';
const DEFAULT_URL = 'https://github.com/wwWallet';

function parsePoweredBy(): { name: string; url: string } {

	if (!POWERED_BY || typeof POWERED_BY !== 'string') {
		return { name: DEFAULT_NAME, url: DEFAULT_URL };
	}

	const parts = POWERED_BY.split('::');
	if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
		return { name: DEFAULT_NAME, url: DEFAULT_URL };
	}

	return { name: parts[0].trim(), url: parts[1].trim() };
}

const PoweredBy = ({ className, linkClassName }: PoweredByProps) => {
	const { t } = useTranslation();
	const { name, url } = parsePoweredBy();

	return (
		<p className={className}>
			<Trans
				i18nKey="sidebar.poweredBy"
				values={{ name }}
				components={{
					docLinkWalletGithub: (
						<a
							href={url}
							rel="noreferrer"
							target="_blank"
							className={linkClassName}
							aria-label={t('sidebar.poweredByAriaLabel', { name })}
						/>
					)
				}}
			/>
		</p>
	);
};

export default PoweredBy;
