import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { FaShare } from 'react-icons/fa';
import { MdOutlineCheckBox, MdOutlineCheckBoxOutlineBlank } from "react-icons/md";
import { useTranslation, Trans } from 'react-i18next';
import { useApi } from '../../api';
import { CredentialImage } from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';
import GetButton from '../Buttons/GetButton';
import { extractCredentialFriendlyName } from "../../functions/extractCredentialFriendlyName";

const formatTitle = (title) => {
  return title.replace(/([a-z])([A-Z])/g, '$1 $2');
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

function SelectCredentials({ showPopup, setShowPopup, setSelectionMap, conformantCredentialsMap, verifierDomainName }) {
	const api = useApi();
	const [vcEntities, setVcEntities] = useState([]);
	const navigate = useNavigate();
	const { t } = useTranslation();
	const keys = Object.keys(conformantCredentialsMap);
	const stepTitles = Object.keys(conformantCredentialsMap).map(key => key);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [currentSelectionMap, setCurrentSelectionMap] = useState({});
	const [requestedFields, setRequestedFields] = useState([]);
	const [showAllFields, setShowAllFields] = useState(false);
	const [credentialDisplay, setCredentialDisplay] = useState({});
	const [selectedCredential, setSelectedCredential] = useState(null);

	useEffect(() => {
		const getData = async () => {
			if (currentIndex == Object.keys(conformantCredentialsMap).length) {
				setSelectionMap(currentSelectionMap);
				setShowPopup(false);
				return;
			}

			try {
				const response = await api.get('/storage/vc');
				const vcEntities = await Promise.all(
					response.data.vc_list.map(async vcEntity => {
						const name = await extractCredentialFriendlyName(vcEntity.credential);
						return { ...vcEntity, friendlyName: name };
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
	}, [api, currentIndex]);

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

	const handleCancel = () => {
		setShowPopup(false);
		navigate('/');
	}

	if (!showPopup) {
		return null;
	};

	const toggleCredentialDisplay = (identifier) => {
		setCredentialDisplay(prev => ({
			...prev,
			[identifier]: !prev[identifier]
		}));
	};

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
		<Modal
			isOpen={true}
			onRequestClose={handleCancel}
			className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg m-4 w-full lg:w-1/3 sm:w-2/3 relative"
			overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		>
			<h2 className="text-lg font-bold mb-2 text-primary dark:text-white">
				<FaShare size={20} className="inline mr-1 mb-1" />
				{t('selectCredentialPopup.title') + formatTitle(stepTitles[currentIndex])}
			</h2>
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
			)
			}

			<div className='flex flex-wrap justify-center flex overflow-y-auto max-h-[40vh] custom-scrollbar bg-gray-50 dark:bg-gray-800 shadow-md rounded-xl mb-2'>
				{vcEntities.map(vcEntity => (
					<>
						<div key={vcEntity.credentialIdentifier} className="m-3 flex flex-col items-center">
							<button
								className={`relative rounded-xl w-2/3 overflow-hidden transition-shadow shadow-md hover:shadow-xl cursor-pointer ${selectedCredential === vcEntity.credentialIdentifier ? 'opacity-100' : 'opacity-50'}`}
								onClick={() => handleClick(vcEntity.credentialIdentifier)}
								aria-label={`${vcEntity.friendlyName}`}
								title={t('selectCredentialPopup.credentialSelectTitle', { friendlyName: vcEntity.friendlyName })}
							>
								<CredentialImage key={vcEntity.credentialIdentifier} credential={vcEntity.credential}
									className={"w-full object-cover rounded-xl"}
								/>
								<div className="absolute bottom-2 right-2" style={{ zIndex: "2000" }}>
									{selectedCredential === vcEntity.credentialIdentifier ? (
										<MdOutlineCheckBox size={20} className="text-white" />
									) : (
										<MdOutlineCheckBoxOutlineBlank size={20} className="text-white" />
									)}
								</div>
							</button>
							<div className='w-2/3 mt-2'>
								<GetButton
									content={credentialDisplay[vcEntity.credentialIdentifier] ? t('selectCredentialPopup.detailsHide') : t('selectCredentialPopup.detailsShow')}
									onClick={() => toggleCredentialDisplay(vcEntity.credentialIdentifier)}
									variant="primary"
									additionalClassName='text-xs w-full'
								/>
								<div
									className={`transition-all ease-in-out duration-1000 overflow-hidden shadow-md rounded-lg dark:bg-gray-700 ${credentialDisplay[vcEntity.credentialIdentifier] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
								>
									<CredentialInfo credential={vcEntity.credential} mainClassName={"text-xs w-full"} />
								</div>
							</div>
						</div>
					</>
				))}
			</div>
			<div className="flex justify-between mt-4">
				<GetButton
					content={t('common.cancel')}
					onClick={handleCancel}
					variant="cancel"
					className="mr-2"
				/>

				<div className="flex gap-2">
					{currentIndex > 0 && (
						<GetButton
							content={t('common.previous')}
							onClick={goToPreviousSelection}
							variant="secondary"
						/>
					)}

					<GetButton
						content={currentIndex < keys.length - 1 ? t('common.next') : t('common.navItemSendCredentialsSimple')}
						onClick={goToNextSelection}
						variant="primary"
						disabled={!selectedCredential}
						title={!selectedCredential ? t('selectCredentialPopup.nextButtonDisabledTitle') : ''}

					/>
				</div>
			</div>

		</Modal >
	);
}

export default SelectCredentials;
