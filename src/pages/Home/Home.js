import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsPlusCircle } from 'react-icons/bs';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { AiOutlineCloseCircle } from 'react-icons/ai';

import Layout from '../../components/Layout';
import addImage from '../../assets/images/cred.png';
import CredentialInfo from '../../components/Home/CredentialInfo';
import { fetchCredentialData } from '../../components/Home/apiUtils';

const Home = () => {
  const [credentials, setCredentials] = useState([]);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
  const [currentSlide, setCurrentSlide] = useState(1);
	const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState(null);

  const navigate = useNavigate();
  const sliderRef = useRef();

	const settings = {
		dots: false,
		arrows: false,
		infinite: true,
		speed: 500,
		slidesToShow: 1,
		slidesToScroll: 1,
		afterChange: (current) => setCurrentSlide(current + 1),
		centerMode: true, // Enable center mode
		centerPadding: '10px', // Set the padding between adjacent images to 2 pixels
		style: { margin: '0 10px' },
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
			const temp_cred = await fetchCredentialData();
			setCredentials(temp_cred);
		};
		getData();
	}, []);

  const handleAddCredential = () => {
    navigate('/issuers');
  };

  const handleImageClick = (credential) => {
			navigate(`/credential/${credential.id}`);
  };


  return (
    <Layout>
      <div className="sm:px-6 w-full">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-custom-blue">Credentials</h1>
          <button
            className="px-2 py-2 mb-2 text-white bg-custom-blue hover:bg-custom-blue-hover focus:ring-4 focus:outline-none focus:ring-custom-blue font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover dark:focus:ring-custom-blue-hover"
            onClick={handleAddCredential}
          >
            <div className="flex items-center">
              <BsPlusCircle size={20} className="text-white mr-2 sm:inline" />
              <span className="sm:inline">Add</span>
              <span className="hidden sm:inline">&nbsp; Credentials</span>
            </div>
          </button>
        </div>
        <hr className="mb-2 border-t border-custom-blue/80" />
        <p className="italic pd-2 text-gray-700">View all of your credentials, and use the 'Add new credentials' card to add more</p>
        <div className='my-4'>
          {isSmallScreen ? (
          	<>
							<Slider ref={sliderRef} {...settings}>
								{credentials.map((credential) => (
									<>
										<div className="relative rounded-xl xl:w-4/5 md:w-full  sm:w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full" onClick={() => {setImageModalOpen(true);setSelectedCredential(credential);}}>
											<img src={credential.src} alt={credential.alt} className="w-full object-cover rounded-xl" />
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
                		<CredentialInfo credential={credential} />
									</>
								))}
					 		</Slider>
				 		</>
          	) : (
							<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
								{credentials.map((credential) => (
									<div
										key={credential.id}
										className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
										onClick={() => handleImageClick(credential)}
									>
										<img src={credential.src} alt={credential.alt} className="w-full h-auto rounded-xl" />
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
			{/* Modal for Fullscreen credential */}
			{isImageModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
					<div className="relative">
						<img src={selectedCredential.src} alt={selectedCredential.src} className="max-w-full max-h-full rounded-xl" />
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

export default Home;
