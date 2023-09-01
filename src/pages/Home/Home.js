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
          alt: item.issuerFriendlyName
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
									<div
										key={image.id}
										className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
										onClick={() => handleImageClick(image)}
									>
										<img src={image.src} alt={image.alt} className="w-full h-auto rounded-xl" />
									</div>
								))}
					 		</Slider>
					 		<div className="flex items-center justify-end mt-2 mr-3">
								<span className="mr-4">{currentSlide} of {credentials.length}</span>
								<button className="" onClick={() => sliderRef.current.slickPrev()}>
									<BiLeftArrow size={22} />
								</button>
								<button onClick={() => sliderRef.current.slickNext()}>
									<BiRightArrow size={22} />
								</button>
							</div>
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
