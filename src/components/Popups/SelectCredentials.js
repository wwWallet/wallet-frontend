import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShare } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { useApi } from '../../api';


function SelectCredentials({ showPopup, setShowPopup, setSelectionMap, conformantCredentialsMap }) {
	const api = useApi();
	const [images, setImages] = useState([]);
	const navigate = useNavigate();
	const { t } = useTranslation();

	const keys = Object.keys(conformantCredentialsMap);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [currentSelectionMap, setCurrentSelectionMap] = useState({});

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
							.filter(vc => conformantCredentialsMap[keys[currentIndex]].includes(vc.credentialIdentifier))
							.map(vc => ({
								id: vc.credentialIdentifier,
								imageURL: vc.logoURL,
							}));

				setImages(simplifiedCredentials);
			} catch (error) {
				console.error('Failed to fetch data', error);
			}
		};

		getData();
	}, [api, currentIndex]);

	const goToNextSelection = () => {
		setCurrentIndex((i) => i+1);
	}

	const handleClick = (id) => {
		const descriptorId = keys[currentIndex];
		setCurrentSelectionMap((currentMap) => {
			currentMap[descriptorId] = id;
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

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="absolute inset-0 bg-black opacity-50"></div>
			<div className="bg-white p-4 rounded-lg shadow-lg w-full max-h-[80vh] lg:w-[33.33%] sm:w-[66.67%] z-10 relative m-4 ">
				<h2 className="text-lg font-bold mb-2 text-custom-blue">
					<FaShare size={20} className="inline mr-1 mb-1" />
					{t('selectCredentialPopup.title')}
				</h2>
				<hr className="mb-2 border-t border-custom-blue/80" />
				<p className="italic pd-2 text-gray-700">
					{t('selectCredentialPopup.description')}
				</p>
				<div className='mt-2 flex flex-wrap justify-center flex overflow-y-auto max-h-[50vh]'>
					{images.map(image => (
						<div className="m-5">
							<img
								key={image.id}
								src={image.imageURL}
								alt={image.id}
								onClick={() => handleClick(image.id)}
								className="w-60 rounded-xl cursor-pointer"
							/>
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
