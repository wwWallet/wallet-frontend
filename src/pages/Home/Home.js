import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsPlusCircle } from 'react-icons/bs';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

import * as api from '../../api';
import Layout from '../../components/Layout';
import addImage from '../../assets/images/cred.png';

import { AiOutlineCloseCircle } from 'react-icons/ai';
import { BiRightArrowAlt,BiSolidCategoryAlt, BiSolidUserCircle } from 'react-icons/bi';
import { AiFillCalendar } from 'react-icons/ai';
import { RiPassExpiredFill } from 'react-icons/ri';
import { MdTitle, MdGrade } from 'react-icons/md';
import { GiLevelEndFlag } from 'react-icons/gi';

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

function parseJwt (token) {
	var base64Url = token.split('.')[1];
	var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
	}).join(''));

	return JSON.parse(jsonPayload);
}
const Home = () => {
  const [credentials, setCredentials] = useState([]);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
  const [currentSlide, setCurrentSlide] = useState(1);
  const navigate = useNavigate();
  const sliderRef = useRef();

  const settings = {
    dots: false,
		arrows: false, // Disable default arrows
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    afterChange: (current) => setCurrentSlide(current + 1),
		style: {margin: '0 10px'}, // Add margin between slides

  };

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await api.get('/storage/vc');
        const newImages = response.data.vc_list.map((item) => ({
          id: item.id,
          src: item.logoURL,
          alt: item.issuerFriendlyName,
					data: parseJwt(item.credential)["vc"]['credentialSubject'],
					type: parseJwt(item.credential)['vc']["type"]["2"],
					expdate: parseJwt(item.credential)['vc']["expirationDate"],

        }));


        setCredentials(newImages);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };
    getData();
  }, []);

  const handleAddCredential = () => {
    navigate('/issuers');
  };

  const handleImageClick = (image) => {
    navigate(`/credential/${image.id}`);
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 w-full">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-custom-blue">Credentials</h1>
          <button
            className="px-2 py-2 mb-2 text-white bg-custom-blue hover:bg-custom-blue-hover focus:ring-4 focus:outline-none focus:ring-custom-blue font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover dark:focus:ring-custom-blue-hover"
            onClick={handleAddCredential}
          >
            <div className="flex items-center">
              <BsPlusCircle size={20} className="text-white mr-2 sm:inline" />
              <span className="sm:inline">Add</span>
              <span className="hidden sm:inline"> Credentials</span>
            </div>
          </button>
        </div>
        <hr className="mb-2 border-t border-custom-blue/80" />
        <p className="italic pd-2 text-gray-700">View all of your credentials, and use the 'Add new credentials' card to add more</p>
        <div className='my-4'>
          {isSmallScreen ? (
          	<>
							<Slider ref={sliderRef} {...settings}>
								{credentials.map((image) => (
									<>
									<div
										key={image.id}
										className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
										onClick={() => handleImageClick(image)}
									>
										<img src={image.src} alt={image.alt} className="w-full h-auto rounded-xl" />
									</div>
									<div className="flex items-center justify-end mt-2 mr-3">
								<span className="mr-4">{currentSlide} of {credentials.length}</span>
								<button className="" onClick={() => sliderRef.current.slickPrev()}>
									<BiLeftArrow size={22} />
								</button>
								<button onClick={() => sliderRef.current.slickNext()}>
									<BiRightArrow size={22} />
								</button>
							</div>
										{/* Block 2: Information List */}
									<div className="pt-5 lg:w-1/2">
									<table className="min-w-auto ">
										<tbody className=" divide-y-4 divide-gray-100">
												<>
													<tr className="text-left bg-white">
														<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
															{getFieldIcon('type')}
														</td>
														<td className="py-2 px-2 rounded-r-xl">{image.type}</td>
													</tr>
													<tr className="text-left bg-white">
														<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
															{getFieldIcon('expdate')}
														</td>
														<td className="py-2 px-2 rounded-r-xl">{image.expdate}</td>
													</tr>
												</>

												<>
													{image.type === 'VerifiableId' && (
														<>
															<tr className="text-left bg-white">
																<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
																	{getFieldIcon('dateOfBirth')}
																</td>
																<td className="py-2 px-2 rounded-r-xl">{image.data.dateOfBirth}</td>
															</tr>
															<tr className="text-left bg-white">
																<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
																	{getFieldIcon('familyName')}
																</td>
																<td className="py-2 px-2 rounded-r-xl">{image.data.familyName}</td>
															</tr>
															<tr className="text-left bg-white">
																<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
																	{getFieldIcon('firstName')}
																</td>
																<td className="py-2 px-2 rounded-r-xl">{image.data.firstName}</td>
															</tr>
														</>
													)}

													{image.type === 'Bachelor' && (
														<>
															<tr className="text-left bg-white">
																<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
																	{getFieldIcon('diplomaTitle')}
																</td>
																<td className="py-2 px-2 rounded-r-xl">{image.data.diplomaTitle}</td>
															</tr>
															<tr className="text-left bg-white">
																<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
																	{getFieldIcon('eqfLevel')}
																</td>
																<td className="py-2 px-2 rounded-r-xl">{image.data.eqfLevel}</td>
															</tr>
															<tr className="text-left bg-white">
																<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
																	{getFieldIcon('familyName')}
																</td>
																<td className="py-2 px-2 rounded-r-xl">{image.data.familyName}</td>
															</tr>
															<tr className="text-left bg-white">
																<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
																	{getFieldIcon('firstName')}
																</td>
																<td className="py-2 px-2 rounded-r-xl">{image.data.firstName}</td>
															</tr>
															<tr className="text-left bg-white">
																<td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
																	{getFieldIcon('grade')}
																</td>
																<td className="py-2 px-2 rounded-r-xl">{image.data.grade}</td>
															</tr>
														</>
													)}
												</>

										</tbody>
									</table>
								</div>
								</>
								))}
					 		</Slider>
				 		</>
          	) : (
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
          	)}
        </div>
      </div>
    </Layout>
  );
};

export default Home;
