import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShare } from 'react-icons/fa';

import { useApi } from '../api';


function Popup({ showPopup, setShowPopup, setSelectedValue, conformantCredentialsMap }) {
  const api = useApi();
	const [images, setImages] = useState([]);
	const navigate = useNavigate();

	useEffect(() => {
		const getData = async () => {
			try {
				const response = await api.get('/storage/vc');
				const simplifiedCredentials = response.data.vc_list
							.filter(vc => conformantCredentialsMap.includes(vc.credentialIdentifier))
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
	}, [api]);

	const handleClick = (id) => {
		setSelectedValue(id);
		setShowPopup(false);
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
		<div className="bg-white p-4 rounded-lg shadow-lg w-full h-[80vh] lg:w-[33.33%] sm:w-[66.67%] z-10 relative m-4 ">
					<h2 className="text-lg font-bold mb-2 text-custom-blue">
									<FaShare size={20} className="inline mr-1 mb-1" /> 
									Select an Option:
								</h2>
								<hr className="mb-2 border-t border-custom-blue/80" />
						<div className='mt-2 flex flex-wrap justify-center flex overflow-y-auto h-[60vh]'>
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
								className='text-sm px-4 py-2 mb-2 bg-red-500 hover:bg-red-700 text-white font-medium rounded-lg'>
								Cancel
							</button>
					</div>
				</div>

	);
}

export default Popup;
