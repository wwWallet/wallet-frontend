import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { BiRightArrowAlt,BiSolidCategoryAlt, BiSolidUserCircle } from 'react-icons/bi';
import { AiFillCalendar } from 'react-icons/ai';
import { RiPassExpiredFill } from 'react-icons/ri';
import { MdTitle, MdGrade } from 'react-icons/md';
import { GiLevelEndFlag } from 'react-icons/gi';

import * as api from '../../api';
import Layout from '../../components/Layout';


const CredentialDetail = () => {
	const { id } = useParams();
	const [credential, setCredentials] = useState(null);

	const [isImageModalOpen, setImageModalOpen] = useState(false); // New state for the modal

	function parseJwt (token) {
		var base64Url = token.split('.')[1];
		var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));

		return JSON.parse(jsonPayload);
	}

	useEffect(() => {
		const getData = async () => {
			try {
				const response = await api.get('/storage/vc');

				const allImages = response.data.vc_list;
				const targetImage = allImages.find((img) => img.id.toString() === id);
				console.log(targetImage)
				const newImages = targetImage
				? [targetImage].map((item) => ({
						id: item.id,
						src: item.logoURL,
						alt: item.issuerFriendlyName,
						data: parseJwt(item.credential)["vc"]['credentialSubject'],
						type: parseJwt(item.credential)['vc']["type"]["2"],
						expdate: parseJwt(item.credential)['vc']["expirationDate"],
					}))
				: [];
			
				console.log(newImages)

			setCredentials(newImages[0]);

			} catch (error) {
				console.error('Failed to fetch data', error);
			}
		};

		getData();
	}, [id]);

	// Define a mapping of field names to their respective icons
	const getFieldIcon = (fieldName) => {
		switch (fieldName) {
			case 'type':
				return <BiSolidCategoryAlt size={25} className="inline mr-1 mb-1" />;
			case 'expdate':
					return <RiPassExpiredFill size={25} className="inline mr-1 mb-1" />;
			case 'dateOfBirth':
				return <AiFillCalendar size={25} className="inline mr-1 mb-1" />;
			case 'familyName':
				return <BiSolidUserCircle size={25} className="inline mr-1 mb-1" />;
			case 'firstName':
				return <BiSolidUserCircle size={25} className="inline mr-1 mb-1" />;
			case 'diplomaTitle':
				return <MdTitle size={25} className="inline mr-1 mb-1" />;
			case 'eqfLevel':
				return <GiLevelEndFlag size={25} className="inline mr-1 mb-1" />;
			case 'grade':
				return <MdGrade size={25} className="inline mr-1 mb-1" />;
			
			default:
				return null;
		}
	};

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
				{credential &&(
								<div className="pt-5 mx-2 px-1 lg:w-1/2 overflow-x-auto">
								<table className="min-w-full">
									<tbody className="divide-y-4 divide-gray-100">
								<>
									<tr className="text-left bg-white">
										<td className="font-bold text-custom-blue py-2 px-2 align-left rounded-l-xl">
											{getFieldIcon('type')}
										</td>
										<td className="py-2 px-2 rounded-r-xl ">{credential.type}</td>
									</tr>
									<tr className="text-left bg-white">
										<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
											{getFieldIcon('expdate')}
										</td>
										<td className="py-2 px-2 rounded-r-xl">{credential.expdate}</td>
									</tr>
								</>

								<>
									{credential.type === 'VerifiableId' && (
										<>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('dateOfBirth')}
												</td>
												<td className="py-2 px-2 rounded-r-xl">{credential.data.dateOfBirth}</td>
											</tr>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('familyName')}
												</td>
												<td className="py-2 px-2 rounded-r-xl">{credential.data.familyName}</td>
											</tr>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('firstName')}
												</td>
												<td className="py-2 px-2 rounded-r-xl">{credential.data.firstName}</td>
											</tr>
										</>
									)}

									{credential.type === 'Bachelor' && (
										<>
											<tr className="text-left bg-white w-full">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('diplomaTitle')}
												</td>
												<td className="py-2 px-2 rounded-r-xl">{credential.data.diplomaTitle}</td>
											</tr>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('eqfLevel')}
												</td>
												<td className="py-2 px-2 rounded-r-xl">{credential.data.eqfLevel}</td>
											</tr>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('familyName')}
												</td>
												<td className="py-2 px-2 rounded-r-xl">{credential.data.familyName}</td>
											</tr>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('firstName')}
												</td>
												<td className="py-2 px-2 rounded-r-xl">{credential.data.firstName}</td>
											</tr>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('grade')}
												</td>
												<td className="py-2 px-2 rounded-r-xl">{credential.data.grade}</td>
											</tr>
										</>
									)}
								</>

						</tbody>
					</table>
			</div>
				)}


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