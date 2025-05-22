import React, { useEffect, useMemo, useState, useContext, useCallback } from 'react';
import PopupLayout from './PopupLayout';
import { FaShare, FaRegCircle, FaCheckCircle } from 'react-icons/fa';
import { useTranslation, Trans } from 'react-i18next';
import CredentialImage from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';
import Button from '../Buttons/Button';
import SessionContext from '@/context/SessionContext';
import useScreenType from '../../hooks/useScreenType';
import Slider from '../Shared/Slider';
import CredentialParserContext from '@/context/CredentialParserContext';
import CredentialCardSkeleton from '../Skeletons/CredentialCardSkeleton';
import { CredentialInfoSkeleton } from '../Skeletons';

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

function SelectCredentialsPopup({ popupState, setPopupState, showPopup, hidePopup, vcEntityList }) {

	const { api } = useContext(SessionContext);
	const credentialParserContext = useContext(CredentialParserContext);
	const [vcEntities, setVcEntities] = useState(null);
	const { t } = useTranslation();
	const keys = useMemo(() => popupState?.options ? Object.keys(popupState.options.conformantCredentialsMap) : null, [popupState]);
	const stepTitles = useMemo(() => popupState?.options ? Object.keys(popupState.options.conformantCredentialsMap).map(key => key) : null, [popupState]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [currentSelectionMap, setCurrentSelectionMap] = useState({});
	const [requestedFields, setRequestedFields] = useState([]);
	const [showAllFields, setShowAllFields] = useState(false);
	const [selectedCredential, setSelectedCredential] = useState(null);
	const screenType = useScreenType();
	const [currentSlide, setCurrentSlide] = useState(1);

	const reinitialize = useCallback(() => {
		setCurrentIndex(0);
		setCurrentSlide(1);
		setCurrentSelectionMap({});
		setRequestedFields([]);
		setSelectedCredential(null);
		setPopupState({ isOpen: false });
	}, [setPopupState]);

	useEffect(() => {
		const getData = async () => {
			if (currentIndex === Object.keys(popupState.options.conformantCredentialsMap).length) {
				reinitialize();
				popupState.resolve(new Map(Object.entries(currentSelectionMap)));
				return;
			}

			try {
				const filteredVcEntities = vcEntityList.filter(vcEntity =>
					popupState.options.conformantCredentialsMap[keys[currentIndex]].credentials.includes(vcEntity.batchId)
				);

				setRequestedFields(popupState.options.conformantCredentialsMap[keys[currentIndex]].requestedFields);
				console.log('filteredVcEntities', filteredVcEntities)
				setVcEntities(filteredVcEntities);
			} catch (error) {
				console.error('Failed to fetch data', error);
			}
		};

		if (popupState?.options && vcEntityList) {
			console.log("opts = ", popupState.options)
			getData();
		}
	}, [
		api,
		currentIndex,
		currentSelectionMap,
		keys,
		popupState,
		vcEntityList,
		credentialParserContext.credentialParserRegistry,
		reinitialize
	]);

	useEffect(() => {
		if (popupState?.options) {
			const currentKey = keys[currentIndex];
			const selectedId = currentSelectionMap[currentKey];
			setSelectedCredential(selectedId);
		}
	}, [currentIndex, currentSelectionMap, keys, popupState]);

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

	const handleClick = (batchId) => {
		const descriptorId = keys[currentIndex];
		if (selectedCredential === batchId) {
			setSelectedCredential(null);
			setCurrentSelectionMap((prev) => ({ ...prev, [descriptorId]: undefined }));
		} else {
			setSelectedCredential(batchId);
			setCurrentSelectionMap((prev) => ({ ...prev, [descriptorId]: batchId }));
		}
	};

	const onClose = () => {
		// setIsOpen(false);
		popupState.reject();
		reinitialize();
		// navigate('/');
	}

	if (!popupState?.isOpen) {
		return null;
	};

	const renderSlideContent = (vcEntity) => (
		<button
			id={`slider-select-credentials-${vcEntity.id}`}
			key={vcEntity.id}
			className="relative rounded-xl transition-shadow shadow-md hover:shadow-xl cursor-pointer"
			tabIndex={currentSlide !== vcEntities.indexOf(vcEntity) + 1 ? -1 : 0}
			onClick={() => handleClick(vcEntity.batchId)}
			aria-label={`${vcEntity.parsedCredential.metadata.credential.name}`}
			title={t('selectCredentialPopup.credentialSelectTitle', { friendlyName: vcEntity.parsedCredential.metadata.credential.name })}
		>
			<CredentialImage
				vcEntity={vcEntity}
				vcEntityInstances={vcEntity.instances}
				key={vcEntity.batchId}
				parsedCredential={vcEntity.parsedCredential}
				className="w-full object-cover rounded-xl"
				showRibbon={currentSlide === vcEntities.indexOf(vcEntity) + 1}
			/>

			<div className={`absolute inset-0 rounded-xl transition-opacity bg-white/50 ${selectedCredential === vcEntity.batchId ? 'opacity-0' : 'opacity-50'}`} />
			<div className="absolute bottom-4 right-4 z-60">
				{selectedCredential === vcEntity.batchId ? (
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
		const fieldNames = requestedFields.map(field => field.name || field.path[0]);

		if (fieldNames.length === 2 && !showAllFields) {
			return `${fieldNames[0]} & ${fieldNames[1]}`;
		} else if (showAllFields) {
			return fieldNames.slice(0, -1).join(', ') + (fieldNames.length > 1 ? ' & ' : '') + fieldNames.slice(-1);
		} else {
			return fieldNames.slice(0, 2).join(', ') + (fieldNames.length > 2 ? '...' : '');
		}
	})();


	return (
		<PopupLayout isOpen={popupState?.isOpen} onClose={onClose} loading={false} fullScreen={screenType !== 'desktop'}>
			<div className={`${screenType !== 'desktop' && 'pb-16'}`}>
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

					{popupState.options.verifierDomainName && (
						<p className="pd-2 text-gray-700 text-sm dark:text-white">
							<span>
								<Trans
									i18nKey={"selectCredentialPopup.purpose"}
									values={{ verifierDomainName: popupState.options.verifierDomainName }}
									components={{ strong: <strong /> }}
								/> {popupState.options.verifierPurpose}
							</span>
						</p>
					)}
					{requestedFieldsText && requestedFields.length > 0 && (
						<p className="pd-2 text-gray-700 text-sm dark:text-white mt-2">
							<span>
								{requestedFields.length === 1 ? `${t('selectCredentialPopup.descriptionFieldsSingle')}` : `${t('selectCredentialPopup.descriptionFieldsMultiple')}`}
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
					)}
					<p className="text-gray-700 italic dark:text-white text-sm mt-2 mb-4">
						{t('selectCredentialPopup.descriptionSelect')}
					</p>

				</div>
				<div className={`${screenType === 'tablet' ? 'px-28' : 'px-4 xl:px-16'}`}>
					{vcEntities ? (
						<Slider
							items={vcEntities}
							renderSlideContent={renderSlideContent}
							onSlideChange={(currentIndex) => setCurrentSlide(currentIndex + 1)}
						/>
					) : (
						<CredentialCardSkeleton />

					)}
					{vcEntities?.[currentSlide - 1] ? (
						<div className={`flex flex-wrap justify-center flex flex-row justify-center items-center mb-2 ${screenType === 'desktop' && 'overflow-y-auto items-center custom-scrollbar max-h-[20vh]'}`}>
							<CredentialInfo parsedCredential={vcEntities[currentSlide - 1].parsedCredential} mainClassName={"text-xs w-full"} />
						</div>
					) : (
						<div className="mt-2">
							<CredentialInfoSkeleton />
						</div>
					)}
				</div>
				<div className={`flex justify-between pt-4 z-10 ${screenType !== 'desktop' && 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 flex px-6 pb-6 flex shadow-2xl rounded-t-lg w-auto'}`}>
					<Button
						id="cancel-select-credentials"
						onClick={onClose}
						variant="cancel"
						className="mr-2"
					>
						{t('common.cancel')}
					</Button>

					<div className="flex gap-2">
						{currentIndex > 0 && (
							<Button
								id="previous-select-credentials"
								variant="secondary"
								onClick={goToPreviousSelection}>
								{t('common.previous')}
							</Button>
						)}

						<Button
							id={`${currentIndex < keys.length - 1 ? 'next' : 'send'}-select-credentials`}
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
			</div>

		</PopupLayout >
	);
}

export default SelectCredentialsPopup;
