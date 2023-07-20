import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import cred_card from '../../assets/images/cred.png';
import addImage from '../../assets/images/cred.png';
import { BsPlusCircle } from 'react-icons/bs';
import { AiOutlineCloseCircle } from 'react-icons/ai';
// import axios from 'axios';
// import Cookies from 'js-cookie';

const Home = () => {

  const images = [
    { id: 1, src: cred_card, alt: 'Image 1' },
    { id: 2,  src: cred_card, alt: 'Image 2' },
    { id: 3,  src: cred_card, alt: 'Image 3' },
    { id: 4,  src: cred_card, alt: 'Image 4' },
		{ id: 5,  src: cred_card, alt: 'Image 5' },
    // { id: 6,  src: cred_card, alt: 'Image 6' },
		// { id: 7,  src: cred_card, alt: 'Image 7' },
    // { id: 8,  src: cred_card, alt: 'Image 8' },
		// { id: 9,  src: cred_card, alt: 'Image 9' },
    // { id: 10, src: cred_card, alt: 'Image 10' },
    // Add more images here
  ];

	const [fullscreenImage, setFullscreenImage] = useState(null);
  const navigate = useNavigate();

  const openFullscreen = (image) => {
    setFullscreenImage(image);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  const handleAddCredential = () => {
    navigate('/issuers');
  };


	// const getData = async () => {
	// 	try {
	// 		const appToken = Cookies.get('appToken'); // Retrieve the app token from cookies
	// 		console.log(appToken);
	// 		const response = await axios.get(`${walletBackendUrl}/storage/vc`, {
	// 			headers: {
	// 				Authorization: `Bearer ${appToken}`,
	// 			},
	// 		});

	// 		// Handle the response data
	// 		console.log(response);
	// 	} catch (error) {
	// 		console.error('Failed to fetch data', error);
	// 	}
	// };

	// // Call the function to fetch data
	// getData();

  return (
    <Layout>
			<div className="px-4 sm:px-6 w-full">

				<h1 className="text-2xl mb-2 font-bold text-custom-blue">Credentials</h1>
				<hr className="mb-2 border-t border-custom-blue/80" />
				<p className="italic pd-2 text-gray-700">View all of your credentials, and use the 'Add new credentials' card to add more</p>
				<div className='my-4'>

					<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
            onClick={() => openFullscreen(image)}
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
      {fullscreenImage && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <img
            src={fullscreenImage.src}
            alt={fullscreenImage.alt}
            className="max-w-full max-h-full rounded-xl"
          />
          <button
							className="absolute top-20 md:top-4 sm:top-4 right-4 text-white text-2xl z-10"
            onClick={closeFullscreen}
          >
              <AiOutlineCloseCircle size={40} />
          </button>
        </div>
      )}
				</div>

			</div>
    </Layout>
  );
};

export default Home;