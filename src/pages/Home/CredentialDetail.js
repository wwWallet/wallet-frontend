import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { BiRightArrowAlt,BiSolidCategoryAlt,BiSolidUserCircle } from 'react-icons/bi'; // Import the icon
import { AiFillCalendar } from 'react-icons/ai';
import { RiPassExpiredFill } from 'react-icons/ri';
import {MdTitle,MdGrade} from 'react-icons/md';
import { GiLevelEndFlag } from 'react-icons/gi';

import * as api from '../../api';
import Layout from '../../components/Layout';


const CredentialDetail = () => {
	const { id } = useParams();
	const [image, setImage] = useState(null);
	const [jsonData, setJsonData] = useState(null);
	const [type, setType] = useState(null);
	const [expdate, setExpDate] = useState(null);

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
				setImage(targetImage);

				const decodedString = parseJwt(targetImage.credential);
				setJsonData(decodedString["vc"]['credentialSubject']);
				setType(decodedString['vc']["type"]["2"]);
				setExpDate(decodedString["vc"]['expirationDate']);
				console.log("decodedString",decodedString);

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
			<div className="px-4 sm:px-6">
				<div className="flex flex-col md:flex-row md:items-center">
					<div className="flex items-center">
						<Link to="/">
    					<h1 className="text-2xl mb-2 font-bold text-gray-500">Credentials</h1>
				  	</Link>
						<BiRightArrowAlt className="text-2xl mb-2 text-custom-blue" />
					</div>
					<h1 className="text-2xl mb-2 font-bold text-custom-blue">{type}</h1>
				</div>
				<hr className="mb-2 border-t border-custom-blue/80" />
				<p className="italic text-gray-700">View all the information about the chosen credential.</p>
			</div>

			<div className="flex flex-col px-4 sm:px-6 mt-4">
				{/* Block 1: Image */}
				<div className='p-5'>
					{image && image.logoURL ? (
					// Open the modal when the image is clicked
					<div className="relative rounded-xl xl:w-1/3 md:w-3/5 overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full" onClick={() => setImageModalOpen(true)}>
					<img src={image.logoURL} alt={image.logoURL} className="w-full object-cover rounded-xl" />

				</div>
					) : (
						<p>No image available</p>
					)}
				</div>

				{/* Block 2: Information List */}
				<div className="p-5">
					<table className="min-w-auto ">
						<tbody className=" divide-y-4 divide-gray-100">
							{image && type && expdate && (
								<>
									<tr className="text-left bg-white">
										<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
											{getFieldIcon('type')}
											Credential type:
										</td>
										<td className="py-2 px-2 rounded-r-xl">{type}</td>
									</tr>
									<tr className="text-left bg-white">
										<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
											{getFieldIcon('expdate')}
											Expiration Date:
										</td>
										<td className="py-2 px-2 rounded-r-xl">{expdate}</td>
									</tr>
								</>
							)}

							{jsonData && (
								<>
									{type === 'VerifiableId' && (
										<>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('dateOfBirth')}
													Birth Date:
												</td>
												<td className="py-2 px-2 rounded-r-xl">{jsonData.dateOfBirth}</td>
											</tr>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('familyName')}
													Last Name:
												</td>
												<td className="py-2 px-2 rounded-r-xl">{jsonData.familyName}</td>
											</tr>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('firstName')}
													First Name:
												</td>
												<td className="py-2 px-2 rounded-r-xl">{jsonData.firstName}</td>
											</tr>
										</>
									)}

									{type === 'Bachelor' && (
										<>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('diplomaTitle')}
													Diploma Title:
												</td>
												<td className="py-2 px-2 rounded-r-xl">{jsonData.diplomaTitle}</td>
											</tr>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('eqfLevel')}
													EQF Level:
												</td>
												<td className="py-2 px-2 rounded-r-xl">{jsonData.eqfLevel}</td>
											</tr>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('familyName')}
													Last Name:
												</td>
												<td className="py-2 px-2 rounded-r-xl">{jsonData.familyName}</td>
											</tr>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('firstName')}
													First Name:
												</td>
												<td className="py-2 px-2 rounded-r-xl">{jsonData.firstName}</td>
											</tr>
											<tr className="text-left bg-white">
												<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
													{getFieldIcon('grade')}
													Grade:
												</td>
												<td className="py-2 px-2 rounded-r-xl">{jsonData.grade}</td>
											</tr>
										</>
									)}
								</>
							)}
						</tbody>
					</table>
				</div>

			</div>
			{/* Modal for Fullscreen Image */}
			{isImageModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
					<div className="relative">
						<img src={image.logoURL} alt={image.logoURL} className="max-w-full max-h-full rounded-xl" />
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