import React, { useEffect, useMemo, useState, useContext, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { FaRegCircle, FaCheckCircle } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faXmark } from '@fortawesome/pro-regular-svg-icons';

import SessionContext from '@/context/SessionContext';
import CredentialParserContext from '@/context/CredentialParserContext';

import useScreenType from '@/hooks/useScreenType';

import Slider from '../Shared/Slider';
import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';
import CredentialInfo from '../Credentials/CredentialInfo';
import CredentialImage from '../Credentials/CredentialImage';

import { CredentialInfoSkeleton } from '../Skeletons';
import CredentialCardSkeleton from '../Skeletons/CredentialCardSkeleton';


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
								className={`
									w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold 
									${isActive ? 
										'text-white bg-primary dark:bg-primary-light border-2 border-primary dark:border-primary-light' 
									: isCurrent ? 
										'text-primary dark:text-white dark:bg-gray-700 border-2 border-primary dark:border-primary-light' 
									: 
										'text-gray-400 border-2 border-gray-400 dark:border-gray-400'
									}
								`}
							>
								{index + 1}
							</div>
							
							<p
								className={`
									text-xs font-bold mt-1 
									max-w-[60px] sm:max-w-[100px] text-center overflow-hidden whitespace-nowrap overflow-ellipsis
									${isActive ? 'text-primary dark:text-primary-light' : isCurrent ? 'text-primary dark:text-white' : 'text-gray-400'}
								`}
								title={formatTitle(stepTitles[index])}
							>
								{formatTitle(stepTitles[index])}
							</p>
						</div>

						{index < totalSteps - 1 && 
							<div className="flex-auto h-[2px] bg-gray-400">
								<div
									className={`h-[2px] ${isActive ? 'bg-primary dark:bg-primary-light' : ''} transition-all duration-300`}
									style={{ width: isActive ? '100%' : '0%' }}
								/>
							</div>
						}
					</React.Fragment>
				);
			})}
		</div>
	);
};

function SelectCredentialsPopup({ popupState, setPopupState, showPopup, hidePopup, vcEntityList }) {
	//General
	const { t } = useTranslation();
	const screenType = useScreenType();
	const { api } = useContext(SessionContext);
	const credentialParserContext = useContext(CredentialParserContext);
	
	//State
	const [isClosing, setIsClosing] = useState(false);
	const [vcEntities, setVcEntities] = useState(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [currentSlide, setCurrentSlide] = useState(1);
	const [showAllFields, setShowAllFields] = useState(false);
	const [requestedFields, setRequestedFields] = useState([]);
	const [currentSelectionMap, setCurrentSelectionMap] = useState({});
	const [selectedCredential, setSelectedCredential] = useState(null);
	
	//Variables
	const keys = useMemo(() => popupState?.options ? Object.keys(popupState.options.conformantCredentialsMap) : null, [popupState]);
	const stepTitles = useMemo(() => popupState?.options ? Object.keys(popupState.options.conformantCredentialsMap).map(key => key) : null, [popupState]);
	
	//Effects
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
					popupState.options.conformantCredentialsMap[keys[currentIndex]].credentials.includes(vcEntity.credentialIdentifier)
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

	//Handlers
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
		setIsClosing(true);
		setTimeout(() => {
			popupState.reject();
			reinitialize();
			setIsClosing(false);
		}, 200);
	}

	const renderSlideContent = (vcEntity) => (
		<button
			id={`slider-select-credentials-${vcEntity.id}`}
			key={vcEntity.id}
			className="relative rounded-xl transition-shadow shadow-md hover:shadow-xl cursor-pointer"
			tabIndex={currentSlide !== vcEntities.indexOf(vcEntity) + 1 ? -1 : 0}
			onClick={() => handleClick(vcEntity.credentialIdentifier)}
			aria-label={`${vcEntity.parsedCredential.metadata.credential.name}`}
			title={t('selectCredentialPopup.credentialSelectTitle', { friendlyName: vcEntity.parsedCredential.metadata.credential.name })}
		>
			<CredentialImage
				vcEntity={vcEntity}
				vcEntityInstances={vcEntity.instances}
				key={vcEntity.credentialIdentifier}
				parsedCredential={vcEntity.parsedCredential}
				className="w-full object-cover rounded-xl"
				showRibbon={currentSlide === vcEntities.indexOf(vcEntity) + 1}
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

	//Check if popup is open
	if (!popupState?.isOpen) {
		return null;
	};

	//Prepare for render
	const requestedFieldsText = (() => {
		const fieldNames = requestedFields.map(field => field.name || field.path[0]);

		if (fieldNames.length === 2 && !showAllFields) {
			return `${fieldNames[0]} and ${fieldNames[1]}`;
		} else if (showAllFields) {
			return fieldNames.slice(0, -1).join(', ') + (fieldNames.length > 1 ? ' and ' : '') + fieldNames.slice(-1);
		} else {
			return fieldNames.slice(0, 2).join(', ') + (fieldNames.length > 2 ? '...' : '');
		}
	})();

	//Render
	return (
		<PopupLayout 
		isOpen={popupState?.isOpen} 
		isClosing={isClosing} 
		onClose={onClose} 
		loading={false} 
		fullScreen={screenType !== 'desktop'}
		>
			{stepTitles && 
				<h2 className="text-xl font-medium text-c-lm-gray-900 dark:text-c-dm-gray-100">
					{t('selectCredentialPopup.title') + formatTitle(stepTitles[currentIndex])}
				</h2>
			}

			{popupState.options.verifierDomainName && 
				<p className="mt-3 text-c-lm-gray-700 dark:text-c-dm-gray-300">
					<span>
						<Trans
							i18nKey={"selectCredentialPopup.descriptionSelect"}
							values={{ verifierDomainName: popupState.options.verifierDomainName }}
							components={{ strong: <strong /> }}
						/>
					</span>
				</p>
			}

			{popupState.options.verifierPurpose &&
				<p className="mt-2 text-c-lm-gray-700 dark:text-c-dm-gray-300">
					<Trans
						i18nKey={"selectCredentialPopup.purpose"}
						values={{ verifierPurpose: popupState.options.verifierPurpose }}
					/>
				</p>
			}

			{requestedFieldsText && requestedFields.length > 0 && 
				<p className="mt-2 text-c-lm-gray-700 dark:text-c-dm-gray-300">
					<span>
						{requestedFields.length === 1 ? `${t('selectCredentialPopup.descriptionFieldsSingle')}` : `${t('selectCredentialPopup.descriptionFieldsMultiple')}`}
					</span>

					&nbsp;

					{requestedFieldsText}.

					{requestedFields.length > 2 &&
						<>
							{' '}
							<Button
							variant='link'
							onClick={handleToggleFields}
							linkLineSize='small'
							>
								{showAllFields ? `${t('selectCredentialPopup.requestedFieldsLess')}` : `${t('selectCredentialPopup.requestedFieldsMore')}`}
							</Button>
							.
						</>
					}
				</p>
			}

			<div className={`mt-5 ${screenType === 'tablet' ? 'px-28' : ''}`}>
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
					<div className={`w-full mt-4 border-t border-c-lm-gray-400 dark:border-c-dm-gray-600 pt-2`}>
						<CredentialInfo parsedCredential={vcEntities[currentSlide - 1].parsedCredential} fullWidth={true} />
					</div>
				) : (
					<div className="mt-2">
						<CredentialInfoSkeleton />
					</div>
				)}
			</div>

			<div className="flex items-center justify-between space-x-2 mt-4">
				{currentIndex === 0 && 
					<Button
						id="cancel-select-credentials"
						variant="cancel"
						onClick={onClose}
						size='md'
						textSize='md'
					>
						{t('common.cancel')}
					</Button>
				}

				{currentIndex > 0 && 
					<Button
						id="previous-select-credentials"
						variant="cancel"
						onClick={goToPreviousSelection}
						size='md'
						textSize='md'
					>
						{t('common.previous')}
					</Button>
				}

				<Button
					id={`${currentIndex < keys.length - 1 ? 'next' : 'send'}-select-credentials`}
					onClick={goToNextSelection}
					disabled={!selectedCredential}
					title={!selectedCredential ? t('selectCredentialPopup.nextButtonDisabledTitle') : ''}
					variant="tertiary"
					size='md'
					textSize='md'
				>
					{currentIndex < keys.length - 1
								? t('common.next')
								: t('common.navItemSendCredentialsSimple')}
				</Button>
			</div>

			<button
				id="dismiss-delete-popup"
				type="button"
				className={`
					absolute top-2 right-2
					bg-c-lm-gray-300 dark:bg-c-dm-gray-800 rounded-lg w-8 h-8 flex justify-center items-center
					hover:bg-c-lm-gray-400 dark:hover:bg-c-dm-gray-700 transition-all duration-150
				`}
				onClick={onClose}
			>
				<FontAwesomeIcon icon={faXmark} className="text-lg text-c-lm-gray-900 dark:text-c-dm-gray-100" />
			</button>
		</PopupLayout >
	);
}

export default SelectCredentialsPopup;
