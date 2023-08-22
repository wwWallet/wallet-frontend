import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import * as api from '../api';


function Popup({ showPopup, setShowPopup, setSelectedValue, conformantCredentialsMap }) {
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
	}, []);

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
		<div className='fixed z-50 inset-0 overflow-y-auto' aria-labelledby='modal-title' role='dialog' aria-modal='true'>
			<div className='flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
				<div className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' aria-hidden='true'></div>

				<div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
					<div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
						<div className='flex justify-between items-center'>
							<h3 className='text-lg leading-6 font-medium text-gray-900' id='modal-title'>Select an option</h3>
							<button
								onClick={handleCancel}
								className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded'>
								Cancel
							</button>
						</div>
						<div className='mt-2 flex flex-wrap justify-center'>
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
					</div>
				</div>
			</div>
		</div>
	);
}

export default Popup;
