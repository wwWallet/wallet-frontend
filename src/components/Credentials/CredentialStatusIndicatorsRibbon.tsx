import React, { memo, MouseEventHandler, ReactElement } from 'react';
import { FaCircleXmark, FaTriangleExclamation } from 'react-icons/fa6';
import { IoShield, IoShieldHalf, IoShieldOutline } from 'react-icons/io5';
import { TbDeviceUsb, TbVersions } from 'react-icons/tb';
import { MdOutlineSync } from 'react-icons/md';
import { type ExtendedVcEntity } from '@/context/CredentialsContext';
import { type CredentialKeyPair } from '@/services/keystore';
import { ParsedCredentialJpt } from 'wallet-common/dist/types';
import { fromBase64Url } from '@/util';

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
	if (type === 'hw-bound') return (
		<span className="p-1">
			<TbDeviceUsb size={18} title="This credential is hardware bound" />
		</span>
	)
})

const CredentialPrivacyLevel = memo(({ level }: { level: PrivacyLevel }) => {
	const icons: Record<PrivacyLevel, ReactElement> = {
		high: <IoShield size={16} title="This credential has the highest privacy level" />,
		medium: <IoShieldHalf size={16} title="This credential has a medium privacy level" />,
		low: <IoShieldOutline size={16} title="This credential has a low privacy level" />,
	};

	return (
		<span className="p-1">
			{icons[level]}
		</span>
	)
})

const CredentialUsages = memo(({ count }: { count: number }) => {
	let Icon: ReactElement;
	let color: string;
	let message: string | undefined;

	if (count > 1) {
		Icon = <TbVersions size={18} title="The number of uses left before this credential will need a refresh" />;
		color = 'text-green-500';
		message = String(count);
	} else if (count === 1) {
		Icon = <FaTriangleExclamation size={16} className="ml-[2px]" title="This credential only has 1 use left before it needs to be refreshed" />;
		color = 'text-yellow-500';
		message = `${String(count)} (refresh soon)`;
	} else {
		Icon = <FaCircleXmark size={16} className="ml-[2px]" title="This credential is exhausted of uses and needs to be refreshed" />;
		color = 'text-red-500';
		message = 'Refresh required'
	}

	return (
		<span className={`p-1 flex gap-1 items-center ${color}`}>
			{Icon} {message}
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
		<button onClick={handleOnClick} className="z-40 absolute top-[-5px] font-semibold right-[-5px] text-gray-900 dark:text-white text-xs px-2 flex gap-1 items-center rounded-lg border-2 border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-800">
			{type && <CredentialType type={type} />}
			{privacyLevel && <CredentialPrivacyLevel level={privacyLevel} />}
			{zeroSigCount && <CredentialUsages count={zeroSigCount} />}
		</button>
	);
};

export default CredentialStatusIndicatorsRibbon;
