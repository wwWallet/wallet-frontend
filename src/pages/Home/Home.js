import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsPlusCircle } from 'react-icons/bs';

import * as api from '../../api';
import Layout from '../../components/Layout';
import addImage from '../../assets/images/cred.png';


const Home = () => {
	const [credentials, setCredentials] = useState([]);
	const navigate = useNavigate();


	const handleAddCredential = () => {
		navigate('/issuers');
	};


	useEffect(() => {

	const getData = async () => {
		try {
			const response = await api.get('/storage/vc');

			console.log(response.data);
			const newImages = response.data.vc_list.map((item) => ({
				id: item.id,
				src: item.logoURL, // Use the logoURL from the vc_list item as the image source
				alt: item.issuerFriendlyName, // Use the issuerFriendlyName from the vc_list item as the image alt text
			}));
			setCredentials(newImages);
			// Handle the response data
			// console.log('Res:',newImages);
		} catch (error) {
			console.error('Failed to fetch data', error);
		}
	};

		// Call the function to fetch data when the component is mounted
		getData();

	}, []); // The empty dependency array ensures that the effect runs only once on component mount.

	const handleImageClick = (image) => {
		// Navigate to the ImageDetailPage with the clicked image details
		navigate(`/credential/${image.id}`);
	};

	return (
		<Layout>
			<div className="px-4 sm:px-6 w-full">

				<h1 className="text-2xl mb-2 font-bold text-custom-blue">Credentials</h1>
				<hr className="mb-2 border-t border-custom-blue/80" />
				<p className="italic pd-2 text-gray-700">View all of your credentials, and use the 'Add new credentials' card to add more</p>
				<div className='my-4'>

					<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
				{credentials.map((image) => (
					<div
						key={image.id}
						className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
						onClick={() => handleImageClick(image)}

					>
						<img src={image.src} alt={image.alt} className="w-full h-auto rounded-xl" />
					</div>
				))}
				<div
					className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
							onClick={handleAddCredential}

				>
					<img
						src={addImage}
						alt="add new credential"
						className="w-full h-auto rounded-xl opacity-100 hover:opacity-120"
					/>
					<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
						<BsPlusCircle size={60} className="text-white mb-2 mt-4" />
						<span className="text-white font-semibold">Add New Credential</span>
					</div>
				</div>
			</div>
			</div>

			</div>
		</Layout>
	);
};

export default Home;