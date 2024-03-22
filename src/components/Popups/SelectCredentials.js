import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShare } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import StatusRibbon from '../../components/Credentials/StatusRibbon';
import { useApi } from '../../api';
import { CredentialImage } from '../Credentials/CredentialImage';


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
	const [renderContent, setRenderContent] = useState(showRequestedFields);
	const [applyTransition, setApplyTransition] = useState(false);


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

	useEffect(() => {
		if (showRequestedFields) {
			setRenderContent(true);
		} else if (applyTransition) {
			setTimeout(() => setRenderContent(false), 500);
		} else {
			setRenderContent(false);
		}
	}, [showRequestedFields, applyTransition]);


	const goToNextSelection = () => {
		setCurrentIndex((i) => i + 1);
	}

	const handleClick = (credentialIdentifier) => {
		const descriptorId = keys[currentIndex];
		setCurrentSelectionMap((currentMap) => {
			currentMap[descriptorId] = credentialIdentifier;
			return currentMap;
		});
		setApplyTransition(false);
		setShowRequestedFields(false);
		goToNextSelection();
	};


	const handleCancel = () => {
		setShowPopup(false);
		navigate('/'); // Navigate to home page or any other route
	}

	if (!showPopup) {
		return null;
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


					<div className="lg:p-0 p-2 mt-4 w-full">
						<div className="mb-2 flex items-center">
							<button
								onClick={() => { setApplyTransition(true); setShowRequestedFields(!showRequestedFields) }}
								className="px-2 py-2 text-white cursor-pointer flex items-center bg-custom-blue hover:bg-custom-blue-hover font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover"
							>
								{showRequestedFields ? 'Hide Credentials Details' : 'Show Requested Fields'}
							</button>
						</div>

						<hr className="my-2 border-t border-gray-300 py-2" />

						<div
							className={`overflow-hidden transition-height ${showRequestedFields ? 'max-h-96' : 'max-h-0'}`}
							style={{ transition: 'max-height 0.5s ease-in-out' }}

						>
							{renderContent && (
								<>
									<p className='mb-2 text-sm italic text-gray-700'>The following fields were requested from the verifier{verifierDomainName}</p>
									<textarea
										readOnly
										value={requestedFields.join('\n')}
										className="w-full border rounded p-2 rounded-xl"
										rows={Math.min(3, Math.max(1, requestedFields.length))}
									></textarea>
								</>
							)}
						</div>
					</div>
				)}

				<div className='flex flex-wrap justify-center flex overflow-y-auto max-h-[40vh]'>
					{images.map(image => (
						<div className="m-3 flex justify-center">
							<div className="relative rounded-xl w-2/3 overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer">
								<CredentialImage key={image.credentialIdentifier} credential={image.credential} onClick={() => handleClick(image.credentialIdentifier)} className={"w-full object-cover rounded-xl"} />
								<StatusRibbon credential={image.credential} />
							</div>
						</div>
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
