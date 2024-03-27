import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShare } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../api';
import { CredentialImage } from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';

function SelectCredentials({ showPopup, setShowPopup, setSelectionMap, conformantCredentialsMap, verifierDomainName }) {
	const api = useApi();
	const [images, setImages] = useState([]);
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
				setShowPopup(false); // finished
				return;
			}

			try {
				const response = await api.get('/storage/vc');
				const simplifiedCredentials = response.data.vc_list
					.filter(vcEntity =>
						conformantCredentialsMap[keys[currentIndex]].credentials.includes(vcEntity.credentialIdentifier)
					);

				setRequestedFields(conformantCredentialsMap[keys[currentIndex]].requestedFields);
				setImages(simplifiedCredentials);
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
		navigate('/'); // Navigate to home page or any other route
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
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="absolute inset-0 bg-black opacity-50"></div>
			<div className="bg-white p-4 rounded-lg shadow-lg w-full lg:max-w-[33.33%] sm:max-w-[66.67%] max-h-[90vh] z-10 relative m-4 overflow-y-auto">
				<h2 className="text-lg font-bold mb-2 text-custom-blue">
					<FaShare size={20} className="inline mr-1 mb-1" />
					{t('selectCredentialPopup.title')}
				</h2>
				<hr className="mb-2 border-t border-custom-blue/80" />
				<p className="italic pd-2 text-gray-700">
					{t('selectCredentialPopup.description')}
				</p>
				{requestedFields && (
					<div className="lg:p-0 p-2 my-4 w-full">
						<div className="mb-2 flex items-center">
							<button
								onClick={toggleRequestedFields}
								className="px-2 py-2 text-white cursor-pointer flex items-center bg-custom-blue hover:bg-custom-blue-hover font-medium rounded-lg text-xs px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover"
							>
								{showRequestedFields ? `${t('selectCredentialPopup.requestedFieldsHide')}` : `${t('selectCredentialPopup.requestedFieldsShow')}`}
							</button>
						</div>

						<hr className="border-t border-gray-300" />

						<div className={`transition-all ease-in-out duration-1000 p-2 overflow-hidden rounded-xl shadow-xl ${showRequestedFields ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 m-0 p-0'}`}>
							<>
								<p className='mb-2 text-sm italic text-gray-700'>{t('selectCredentialPopup.requestedFieldsinfo')} {verifierDomainName}</p>
								<textarea
									readOnly
									value={requestedFields.join('\n')}
									className="p-2 border rounded-lg text-sm"
									style={{ width: '-webkit-fill-available' }}
									rows={Math.min(3, Math.max(1, requestedFields.length))}
								></textarea>
							</>
						</div>
					</div>
				)}

				<div className='flex flex-wrap justify-center flex overflow-y-auto max-h-[40vh]'>
					{images.map(image => (
						<>
							<div key={image.credentialIdentifier} className="m-3 flex flex-col items-center">
								<div className="relative rounded-xl w-2/3 overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer">
									<CredentialImage key={image.credentialIdentifier} credential={image.credential} onClick={() => handleClick(image.credentialIdentifier)} className={"w-full object-cover rounded-xl"} />
								</div>
								<div className='w-2/3 mt-2'>
									<button
										onClick={() => toggleCredentialDisplay(image.credentialIdentifier)}
										className="text-xs py-2 w-full bg-custom-blue hover:bg-custom-blue-hover text-white font-medium rounded-lg">
										{credentialDisplay[image.credentialIdentifier] ? 'Hide Details' : 'Show Details'}
									</button>
									<div
										className={`transition-all ease-in-out duration-1000 overflow-hidden shadow-lg rounded-lg ${credentialDisplay[image.credentialIdentifier] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
									>
										<CredentialInfo credential={image.credential} mainClassName={"text-xs w-full"} />
									</div>
								</div>
							</div>
						</>
					))}
				</div>
				<button
					onClick={handleCancel}
					className='text-sm px-4 py-2 my-2 bg-red-500 hover:bg-red-700 text-white font-medium rounded-lg'>
					{t('common.cancel')}
				</button>
			</div>
		</div>
	);
}

export default SelectCredentials;
