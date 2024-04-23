import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { FaShare } from 'react-icons/fa';
import { useTranslation, Trans } from 'react-i18next';
import { useApi } from '../../api';
import { CredentialImage } from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';
import GetButton from '../Buttons/GetButton';
import { extractCredentialFriendlyName } from "../../functions/extractCredentialFriendlyName";

const StepBar = ({ totalSteps, currentStep }) => {
	return (
		<div className="flex items-center justify-center w-full my-4">
			{Array.from({ length: totalSteps }, (_, index) => {
				const isActive = index + 1 <= currentStep;
				return (
					<React.Fragment key={index}>
						<div
							className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isActive ? 'bg-primary dark:bg-primary-light border-2 border-primary dark:border-primary-light' : 'bg-gray-700 border-2 border-gray-300'
								}`}
						>
							{index + 1}
						</div>
						{index < totalSteps - 1 && (
							<div className="flex-auto mx-2 h-[2px] bg-gray-300">
								<div
									className={` h-[2px] ${isActive ? 'bg-primary dark:bg-primary-light' : 'bg-gray-300'} transition-all duration-300`}
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
	const [currentIndex, setCurrentIndex] = useState(0);
	const [currentSelectionMap, setCurrentSelectionMap] = useState({});
	const [requestedFields, setRequestedFields] = useState([]);
	const [showRequestedFields, setShowRequestedFields] = useState(false);
	const [credentialDisplay, setCredentialDisplay] = useState({});

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

	const goToNextSelection = () => {
		setCurrentIndex((i) => i + 1);
	}

	const handleClick = (credentialIdentifier) => {
		const descriptorId = keys[currentIndex];
		setCurrentSelectionMap((currentMap) => {
			currentMap[descriptorId] = credentialIdentifier;
			return currentMap;
		});
		goToNextSelection();
	};

	const handleCancel = () => {
		setShowPopup(false);
		navigate('/');
	}

	if (!showPopup) {
		return null;
	};

	const toggleRequestedFields = () => {
		setShowRequestedFields(!showRequestedFields);
	};

	const toggleCredentialDisplay = (identifier) => {
		setCredentialDisplay(prev => ({
			...prev,
			[identifier]: !prev[identifier]
		}));
	};

	return (
		<Modal
			isOpen={true}
			onRequestClose={handleCancel}
			className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg m-4 w-full lg:w-1/3 sm:w-2/3 relative"
			overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		>
			<h2 className="text-lg font-bold mb-2 text-primary dark:text-white">
				<FaShare size={20} className="inline mr-1 mb-1" />
				{t('selectCredentialPopup.title')}
			</h2>
			<StepBar totalSteps={keys.length} currentStep={currentIndex + 1} />

			<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
			{verifierDomainName && (

				<p className="italic pd-2 text-gray-700 dark:text-gray-300">
					<Trans
						i18nKey="selectCredentialPopup.description"
						values={{ verifierDomainName }}
						components={{ strong: <strong /> }}
					/>
				</p>
			)}
			{requestedFields && (
				<div className="my-3 w-full">
					<div className="mb-2 flex items-center">
						<GetButton
							content={showRequestedFields ? `${t('selectCredentialPopup.requestedFieldsHide')}` : `${t('selectCredentialPopup.requestedFieldsShow')}`}
							onClick={toggleRequestedFields}
							variant="primary"
							additionalClassName='text-xs'
						/>
					</div>

					<hr className="border-t border-primary/80 dark:border-primary-light/80" />

					<div className={`transition-all ease-in-out duration-1000 p-2 overflow-hidden rounded-md shadow-md bg-gray-50 dark:bg-gray-800 ${showRequestedFields ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
						<>
							<textarea
								readOnly
								value={requestedFields.join('\n')}
								className={`p-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white ${showRequestedFields ? 'visible' : 'hidden'}`}
								style={{ width: '-webkit-fill-available' }}
								rows={Math.min(3, Math.max(1, requestedFields.length))}

							></textarea>
						</>
					</div>
				</div>
			)}

			<div className='flex flex-wrap justify-center flex overflow-y-auto max-h-[40vh] custom-scrollbar bg-gray-50 dark:bg-gray-800 shadow-md rounded-xl mb-2'>
				{vcEntities.map(vcEntity => (
					<>
						<div key={vcEntity.credentialIdentifier} className="m-3 flex flex-col items-center">
							<button
								className="relative rounded-xl w-2/3 overflow-hidden transition-shadow shadow-md hover:shadow-xl cursor-pointer"
								onClick={() => handleClick(vcEntity.credentialIdentifier)}
								aria-label={`${vcEntity.friendlyName}`}
								title={t('selectCredentialPopup.credentialSelectTitle', { friendlyName: vcEntity.friendlyName })}
							>
								<CredentialImage key={vcEntity.credentialIdentifier} credential={vcEntity.credential}
									className={"w-full object-cover rounded-xl"}
								/>
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
			<GetButton
				content={t('common.cancel')}
				onClick={handleCancel}
				variant="cancel"
			/>
		</Modal>
	);
}

export default SelectCredentials;
