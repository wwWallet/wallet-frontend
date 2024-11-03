import React, { useEffect, useMemo, useState, useContext } from 'react';
import PopupLayout from './PopupLayout';
import { useNavigate } from 'react-router-dom';
import { FaShare, FaRegCircle, FaCheckCircle } from 'react-icons/fa';
import { useTranslation, Trans } from 'react-i18next';
import CredentialImage from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';
import Button from '../Buttons/Button';
import SessionContext from '../../context/SessionContext';
import ContainerContext from '../../context/ContainerContext';
import useScreenType from '../../hooks/useScreenType';
import Slider from '../Shared/Slider';

const formatTitle = (title) => {
	if (title) {
		return title.replace(/([a-z])([A-Z])/g, '$1 $2');
	} else {
		return;
	}
};

const StepBar = ({ totalSteps, currentStep, stepTitles }) => {

	return (
		<div className="flex items-center justify-center w-full my-4">
			{Array.from({ length: totalSteps }, (_, index) => {
				const isActive = index + 1 < currentStep;
				const isCurrent = index + 1 === currentStep;
				return (
					<React.Fragment key={index}>
						<div className="flex flex-col items-center">
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'text-white bg-primary dark:bg-primary-light border-2 border-primary dark:border-primary-light' : isCurrent ? 'text-primary dark:text-white dark:bg-gray-700 border-2 border-primary dark:border-primary-light' : 'text-gray-400 border-2 border-gray-400 dark:border-gray-400'
									}`}
							>
								{index + 1}
							</div>
							<p
								className={`text-xs font-bold mt-1 ${isActive ? 'text-primary dark:text-primary-light' : isCurrent ? 'text-primary dark:text-white' : 'text-gray-400'} max-w-[60px] sm:max-w-[100px] text-center overflow-hidden whitespace-nowrap overflow-ellipsis`}
								title={formatTitle(stepTitles[index])}
							>
								{formatTitle(stepTitles[index])}
							</p>
						</div>
						{index < totalSteps - 1 && (
							<div className="flex-auto h-[2px] bg-gray-400">
								<div
									className={`h-[2px] ${isActive ? 'bg-primary dark:bg-primary-light' : ''} transition-all duration-300`}
									style={{ width: isActive ? '100%' : '0%' }}
								></div>
							</div>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
};

function SelectCredentialsPopup({ isOpen, setIsOpen, setSelectionMap, conformantCredentialsMap, verifierDomainName }) {
	const { api } = useContext(SessionContext);
	const [vcEntities, setVcEntities] = useState([]);
	const navigate = useNavigate();
	const { t } = useTranslation();
	const keys = useMemo(() => Object.keys(conformantCredentialsMap), [conformantCredentialsMap]);
	const stepTitles = useMemo(() => Object.keys(conformantCredentialsMap).map(key => key), [conformantCredentialsMap]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [currentSelectionMap, setCurrentSelectionMap] = useState({});
	const [requestedFields, setRequestedFields] = useState([]);
	const [showAllFields, setShowAllFields] = useState(false);
	const [selectedCredential, setSelectedCredential] = useState(null);
	const container = useContext(ContainerContext);
	const screenType = useScreenType();
	const [currentSlide, setCurrentSlide] = useState(1);

	useEffect(() => {
		const getData = async () => {
			if (currentIndex === Object.keys(conformantCredentialsMap).length) {
				setSelectionMap(currentSelectionMap);
				setIsOpen(false);
				return;
			}

			try {
				const response = await api.get('/storage/vc');
				const vcEntities = await Promise.all(
					response.data.vc_list.map(async vcEntity => {
						return container.credentialParserRegistry.parse(vcEntity.credential).then((c) => {
							if ('error' in c) {
								return;
							}
							return { ...vcEntity, friendlyName: c.credentialFriendlyName }
						});
					})
				);

				const filteredVcEntities = vcEntities.filter(vcEntity =>
					conformantCredentialsMap[keys[currentIndex]].credentials.includes(vcEntity.credentialIdentifier)
				);

				setRequestedFields(conformantCredentialsMap[keys[currentIndex]].requestedFields);
				setVcEntities(filteredVcEntities);
			} catch (error) {
				console.error('Failed to fetch data', error);
			}
		};

		getData();
	}, [
		api,
		conformantCredentialsMap,
		currentIndex,
		currentSelectionMap,
		keys,
		setSelectionMap,
		setIsOpen,
		container.credentialParserRegistry,
	]);

	useEffect(() => {
		const currentKey = keys[currentIndex];
		const selectedId = currentSelectionMap[currentKey];
		setSelectedCredential(selectedId);
	}, [currentIndex, currentSelectionMap, keys]);

	const goToNextSelection = () => {
		setShowAllFields(false);
		setCurrentIndex((i) => i + 1);
	}

	const goToPreviousSelection = () => {
		if (currentIndex > 0) {
			setShowAllFields(false);
			setCurrentIndex(currentIndex - 1);
		}
	};

	const handleClick = (credentialIdentifier) => {
		const descriptorId = keys[currentIndex];
		if (selectedCredential === credentialIdentifier) {
			setSelectedCredential(null);
			setCurrentSelectionMap((prev) => ({ ...prev, [descriptorId]: undefined }));
		} else {
			setSelectedCredential(credentialIdentifier);
			setCurrentSelectionMap((prev) => ({ ...prev, [descriptorId]: credentialIdentifier }));
		}
	};

	const onClose = () => {
		setIsOpen(false);
		navigate('/');
	}

	if (!isOpen) {
		return null;
	};

	const renderSlideContent = (vcEntity) => (
		<button
			key={vcEntity.id}
			className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-xl cursor-pointer"
			tabIndex={currentSlide !== vcEntities.indexOf(vcEntity) + 1 ? -1 : 0}
			onClick={() => handleClick(vcEntity.credentialIdentifier)}
			aria-label={`${vcEntity.friendlyName}`}
			title={t('selectCredentialPopup.credentialSelectTitle', { friendlyName: vcEntity.friendlyName })}
		>
			<CredentialImage
				key={vcEntity.credentialIdentifier}
				credential={vcEntity.credential}
				className="w-full object-cover rounded-xl"
			/>

			<div className={`absolute inset-0 rounded-xl transition-opacity bg-white/50 ${selectedCredential === vcEntity.credentialIdentifier ? 'opacity-0' : 'opacity-50'}`} />
			<div className="absolute bottom-4 right-4 z-60">
				{selectedCredential === vcEntity.credentialIdentifier ? (
					<FaCheckCircle size={30} className="z-50 rounded-full bg-white text-primary dark:text-primary-light" />
				) : (
					<FaRegCircle size={30} className="z-50 rounded-full bg-white/50 text-primary dark:text-primary-light" />
				)}
			</div>
		</button>
	);

	const handleToggleFields = () => {
		setShowAllFields(!showAllFields);
	};

	const requestedFieldsText = (() => {
		if (requestedFields.length === 2 && !showAllFields) {
			return `${requestedFields[0]} & ${requestedFields[1]}`;
		} else if (showAllFields) {
			return requestedFields.slice(0, -1).join(', ') + (requestedFields.length > 1 ? ' & ' : '') + requestedFields.slice(-1);
		} else {
			return requestedFields.slice(0, 2).join(', ') + (requestedFields.length > 2 ? '...' : '');
		}
	})();

	return (
		<PopupLayout isOpen={isOpen} onClose={onClose} loading={false} fullScreen={screenType === 'mobile'}>
			<div>
				{stepTitles && (
					<h2 className="text-lg font-bold mb-2 text-primary dark:text-white">
						<FaShare size={20} className="inline mr-1 mb-1" />
						{t('selectCredentialPopup.title') + formatTitle(stepTitles[currentIndex])}
					</h2>
				)}
				{keys.length > 1 && (
					<StepBar totalSteps={keys.length} currentStep={currentIndex + 1} stepTitles={stepTitles} />
				)}
				<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />

				{requestedFieldsText && requestedFields.length > 0 && verifierDomainName && (
					<>
						<p className="pd-2 text-gray-700 text-sm dark:text-white">
							<span>
								<Trans
									i18nKey={requestedFields.length === 1 ? "selectCredentialPopup.descriptionFieldsSingle" : "selectCredentialPopup.descriptionFieldsMultiple"}
									values={{ verifierDomainName }}
									components={{ strong: <strong /> }}
								/>
							</span>
							&nbsp;
							<strong>
								{requestedFieldsText}
							</strong>
							{requestedFields.length > 2 && (
								<>
									{' '}
									< button onClick={handleToggleFields} className="text-primary dark:text-extra-light hover:underline inline">
										{showAllFields ? `${t('selectCredentialPopup.requestedFieldsLess')}` : `${t('selectCredentialPopup.requestedFieldsMore')}`}
									</button>
								</>
							)}.
						</p>
						<p className="text-gray-700 dark:text-white text-sm mt-2 mb-4">
							{t('selectCredentialPopup.descriptionSelect')}
						</p>
					</>
				)}
			</div>
			<div className='px-4'>
				<Slider
					items={vcEntities}
					renderSlideContent={renderSlideContent}
					onSlideChange={(currentIndex) => setCurrentSlide(currentIndex + 1)}
				/>
			</div>
			{vcEntities[currentSlide - 1] && (
				<div className={`flex flex-wrap justify-center flex flex-row justify-center overflow-y-auto items-center custom-scrollbar mb-2 ${screenType === 'mobile' ? 'h-full' : 'max-h-[25vh]'}`}>
					<CredentialInfo credential={vcEntities[currentSlide - 1].credential} mainClassName={"text-xs w-full"} />
				</div>
			)}
			<div className="flex justify-between mt-4">
				<Button
					onClick={onClose}
					variant="cancel"
					className="mr-2"
				>
					{t('common.cancel')}
				</Button>

				<div className="flex gap-2">
					{currentIndex > 0 && (
						<Button variant="secondary" onClick={goToPreviousSelection}>
							{t('common.previous')}
						</Button>
					)}

					<Button
						onClick={goToNextSelection}
						variant="primary"
						disabled={!selectedCredential}
						title={!selectedCredential ? t('selectCredentialPopup.nextButtonDisabledTitle') : ''}
					>
						{currentIndex < keys.length - 1
							? t('common.next')
							: t('common.navItemSendCredentialsSimple')}
					</Button>
				</div>
			</div>
		</PopupLayout >
	);
}

export default SelectCredentialsPopup;
