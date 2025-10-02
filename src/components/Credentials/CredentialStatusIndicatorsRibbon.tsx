import React, { memo, MouseEventHandler, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCircleXmark, FaTriangleExclamation } from 'react-icons/fa6';
import { IoShield, IoShieldHalf, IoShieldOutline } from 'react-icons/io5';
import { TbDeviceUsb, TbVersions } from 'react-icons/tb';
import { ParsedCredentialJpt } from 'wallet-common/dist/types';
import { fromBase64Url } from '@/util';
import { type ExtendedVcEntity } from '@/context/CredentialsContext';
import { type CredentialKeyPair } from '@/services/keystore';

type Type = 'hw-bound' | 'synced';
type PrivacyLevel = 'high' | 'medium' | 'low';

type StatusIndicators = {
	type: Type | undefined;
	privacyLevel: PrivacyLevel | undefined;
	zeroSigCount: number | undefined;
}

type KeyPairs = {
	kid: string,
	keypair: CredentialKeyPair,
}[];

function getCredentialStatusIndicators(vcEntity: ExtendedVcEntity, keypairs: KeyPairs ): StatusIndicators {
	const credentialKeyPair = keypairs?.find(kp => kp.kid === vcEntity.kid);

	let kid: string, alg: string, keypair: CredentialKeyPair;

	if (credentialKeyPair) {
		kid = credentialKeyPair.kid;
		keypair = credentialKeyPair.keypair;
		alg = keypair.alg
	} else {
		if ('issuerHeader' in vcEntity.parsedCredential) {
			const parsedCred = vcEntity.parsedCredential as ParsedCredentialJpt;
			alg = parsedCred.issuerHeader.alg as string;
		}

		if (vcEntity.data) {
			const credParts = vcEntity.data.split('.');
			const dpkJwk = JSON.parse(new TextDecoder().decode(fromBase64Url(credParts[credParts.length - 1].split('~')[1])));

			kid = dpkJwk.kid;
			keypair = keypairs.find(keypair => keypair.kid === dpkJwk.kid)?.keypair;
		}
	}

	const type = (() => {
		if (!keypair) return undefined;
		if ('externalPrivateKey' in keypair) return 'hw-bound';
		if ('wrappedPrivateKey' in keypair) return 'synced';
		return undefined;
	})();

	const privacyLevel = (() => {
		if (alg === 'experimental/SplitBBSv2.1') return 'high';
		if (vcEntity.instances.length > 1) return 'medium';
		return 'low';
	})();

	const zeroSigCount = (() => {
		if (privacyLevel !== 'medium') return undefined;
		return vcEntity.instances?.filter(instance => instance.sigCount === 0).length || 0;
	})();

	return {
		type,
		privacyLevel,
		zeroSigCount,
	}
}

const CredentialType = memo(({ type }: { type: Type }) => {
	const { t } = useTranslation();

	// TODO: Icons need accessible labels.
	if (type === 'hw-bound') return (
		<span className="p-1" title={t('credentialStatusIndicators.type.hwBound')}>
			<TbDeviceUsb size={18} />
		</span>
	)
});

const CredentialPrivacyLevel = memo(({ level }: { level: PrivacyLevel }) => {
	const { t } = useTranslation();

	const className = `privacy-level--${level}`;

	// TODO: Icons need accessible labels.
	const icons: Record<PrivacyLevel, ReactElement> = {
		high: <IoShield size={16} />,
		medium: <IoShieldHalf size={16} />,
		low: <IoShieldOutline size={16} />,
	};

	return (
		<span className={`p-1 ${className}`} title={t(`credentialStatusIndicators.privacyLevel.${level}`)}>
			{icons[level]}
		</span>
	)
});

const CredentialUsages = memo(({ count }: { count: number }) => {
	const { t } = useTranslation();

	let Icon: ReactElement;
	let color: string;
	let title: string;
	let label: string | undefined;

	// TODO: Icons need accessible labels.
	if (count > 1) {
		title = t('credentialStatusIndicators.usages.full');
		Icon = <TbVersions size={18} />;
		color = 'text-green-500';
		label = String(count);
	} else if (count === 1) {
		title = t('credentialStatusIndicators.usages.almostEmpty');
		Icon = <FaTriangleExclamation size={16} className="ml-[2px]" />;
		color = 'text-yellow-500';
		label = `${String(count)} ${t('credentialStatusIndicators.usages.almostEmptyLabel')}`;
	} else {
		title = t('credentialStatusIndicators.usages.empty');
		Icon = <FaCircleXmark size={16} className="ml-[2px]" />;
		color = 'text-red-500';
		label = t('credentialStatusIndicators.usages.almostEmptyLabel');
	}

	return (
		<span className={`p-1 flex gap-1 items-center ${color}`} title={title}>
			{Icon} {label}
		</span>
	)
});

export type CredentialStatusIndicatorsRibbonProps = {
	vcEntity: ExtendedVcEntity;
	walletStateKeypairs: KeyPairs
}

const CredentialStatusIndicatorsRibbon = (
	{ vcEntity, walletStateKeypairs }: CredentialStatusIndicatorsRibbonProps
) => {
	const { type, privacyLevel, zeroSigCount } = getCredentialStatusIndicators(vcEntity, walletStateKeypairs);

	const handleOnClick: MouseEventHandler = (event) => {
		event.stopPropagation();
		// TODO: dialog element explaining the icons here
	}

	return (
		<button onClick={handleOnClick} className="z-40 absolute top-[-5px] font-semibold right-[-5px] cursor-default text-gray-900 dark:text-white text-xs px-2 flex gap-1 items-center rounded-lg border-2 border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-800">
			{type && <CredentialType type={type} />}
			{privacyLevel && <CredentialPrivacyLevel level={privacyLevel} />}
			{zeroSigCount && <CredentialUsages count={zeroSigCount} />}
		</button>
	);
}

export default CredentialStatusIndicatorsRibbon;
