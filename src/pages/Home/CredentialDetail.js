// CredentialDetail.js

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { BiRightArrowAlt } from 'react-icons/bi';

import Layout from '../../components/Layout';
import CredentialInfo from '../../components/Home/CredentialInfo';
import { fetchCredentialData } from '../../components/Home/apiUtils';

const CredentialDetail = () => {
	const { id } = useParams();
	const [credential, setCredentials] = useState(null);
	const [isImageModalOpen, setImageModalOpen] = useState(false);

	useEffect(() => {
		const getData = async () => {
			const newCredential = await fetchCredentialData(id);
			setCredentials(newCredential);
		};
		getData();
	}, [id]);

	return (
		<Layout>
			<div className=" sm:px-6">
				<div className="flex flex-col sm:flex-row sm:items-center">
					<div className="flex items-center">
						<Link to="/">
    					<h1 className="text-2xl mb-2 font-bold text-gray-500">Credentials</h1>
				  	</Link>
						<BiRightArrowAlt className="text-2xl mb-2 text-custom-blue" />
					</div>
					{credential && (
						<h1 className="text-2xl mb-2 font-bold text-custom-blue">{credential.type}</h1>
					)}
				</div>
				<hr className="mb-2 border-t border-custom-blue/80" />
				<p className="italic text-gray-700">View all the information about the chosen credential.</p>
			</div>

			<div className="flex flex-col lg:flex-row sm:px-6 mt-4">
				{/* Block 1: credential */}
				<div className='p-5 lg:w-1/2'>
					{credential && credential.src ? (
					// Open the modal when the credential is clicked
					<div className="relative rounded-xl xl:w-4/5 md:w-full  sm:w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full" onClick={() => setImageModalOpen(true)}>
						<img src={credential.src} alt={credential.alt} className="w-full object-cover rounded-xl" />

					</div>
					) : (
						<p>No credential available</p>
					)}
				</div>

				{/* Block 2: Information List */}
				{credential && <CredentialInfo credential={credential} />} {/* Use the CredentialInfo component */}
			</div>
			{/* Modal for Fullscreen credential */}
			{isImageModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
					<div className="relative">
						<img src={credential.src} alt={credential.src} className="max-w-full max-h-full rounded-xl" />
					</div>
					<button
							className="absolute top-20 md:top-4 sm:top-4 right-4 text-white text-2xl z-10"
							onClick={() => setImageModalOpen(false)}
					>
							<AiOutlineCloseCircle size={40} />
					</button>
				</div>
			)}
		</Layout>
	);
};

export default CredentialDetail;