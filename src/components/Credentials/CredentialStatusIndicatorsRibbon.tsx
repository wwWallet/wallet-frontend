import React, { memo, MouseEventHandler, ReactElement } from 'react';
import { FaCircleXmark, FaTriangleExclamation } from 'react-icons/fa6';
import { IoShield, IoShieldHalf, IoShieldOutline } from 'react-icons/io5';
import { TbDeviceUsb, TbVersions } from 'react-icons/tb';
import { MdOutlineSync } from 'react-icons/md';
import { type Instance, type ExtendedVcEntity } from '@/context/CredentialsContext';
import { type CredentialKeyPair } from '@/services/keystore';

type Type = 'hw-bound' | 'synced';
type PrivacyLevel = 'high' | 'medium' | 'low';

function getCredentialType(keypair: CredentialKeyPair): Type | undefined {
  if ('externalPrivateKey' in keypair) return 'hw-bound';
  if ('wrappedPrivateKey' in keypair) return 'synced';
  return undefined;
};

function getPrivacyLevel(keypair: CredentialKeyPair, instances: Instance[]): PrivacyLevel {
  if (keypair.alg === 'experimental/SplitBBSv2.1') return 'high';
  if (instances.length > 1) return 'medium';
  return 'low';
};

const CredentialType = memo(({ type }: { type: Type }) => {
	let Icon: ReactElement;

	switch (type) {
		case 'hw-bound':
			Icon = <TbDeviceUsb size={18} />;
			break;
		case 'synced':
			Icon = <MdOutlineSync size={18} />;
			break;
	}

	return (
		<span>
			{Icon}
		</span>
	)
})

const CredentialPrivacyLevel = memo(({ level }: { level: PrivacyLevel }) => {
	const icons: Record<PrivacyLevel, ReactElement> = {
		high: <IoShield size={16} />,
		medium: <IoShieldHalf size={16} />,
		low: <IoShieldOutline size={16} />,
	};

	return (
		<span>
			{icons[level]}
		</span>
	)
})

const CredentialUsages = memo(({ count }: { count: number }) => {
	let Icon: ReactElement;
	let color: string;

	if (count > 3) {
		Icon = <TbVersions size={18} />;
		color = 'text-green-500';
	} else if (count <= 3 && count > 0) {
		Icon = <FaTriangleExclamation size={16} className="ml-[2px]" />;
		color = 'text-yellow-500';
	} else {
		Icon = <FaCircleXmark size={16} className="ml-[2px]" />;
		color = 'text-red-500';
	}

	return (
		<span className={`flex gap-1 items-center ${color}`}>
			{Icon} {count}
		</span>
	)
});

export type CredentialStatusIndicatorsRibbonProps = {
	vcEntity: ExtendedVcEntity;
	walletStateKeypairs: {
		kid: string,
		keypair: CredentialKeyPair,
	}[]
}

const CredentialStatusIndicatorsRibbon = (
	{ vcEntity, walletStateKeypairs }: CredentialStatusIndicatorsRibbonProps
) => {
	const zeroSigCount = vcEntity.instances?.filter(instance => instance.sigCount === 0).length || 0;
	const keypair = walletStateKeypairs?.find(kp => kp.kid === vcEntity.kid) ?? null;

	let type: Type | undefined;
	let privacyLevel: PrivacyLevel | undefined;

	if (keypair) {
		type = getCredentialType(keypair.keypair);
		privacyLevel = getPrivacyLevel(keypair.keypair, vcEntity.instances);
	}

	const handleOnClick: MouseEventHandler = (event) => {
		event.stopPropagation();
		// TODO: dialog element explaining the icons here
	}

	return (
		<button onClick={handleOnClick} className="z-40 absolute top-[-5px] font-semibold right-[-5px] text-gray-900 dark:text-white text-xs py-1 px-3 flex gap-1 items-center rounded-lg border-2 border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-800">
			{type && <CredentialType type={type} />}
			{privacyLevel && <CredentialPrivacyLevel level={privacyLevel} />}
			<CredentialUsages count={zeroSigCount} />
		</button>
	);
};

export default CredentialStatusIndicatorsRibbon;
