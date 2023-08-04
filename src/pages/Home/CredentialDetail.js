import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import Layout from '../../components/Layout';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { BiRightArrowAlt } from 'react-icons/bi'; // Import the icon

const CredentialDetail = () => {
  const { id } = useParams();
  const walletBackendUrl = process.env.REACT_APP_WALLET_BACKEND_URL;
  const [image, setImage] = useState(null);
  const [jsonData, setJsonData] = useState(null);
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
        const appToken = Cookies.get('appToken');
        const response = await axios.get(`${walletBackendUrl}/storage/vc`, {
          headers: {
            Authorization: `Bearer ${appToken}`,
          },
        });

        const allImages = response.data.vc_list;
        const targetImage = allImages.find((img) => img.id.toString() === id);
        setImage(targetImage);

        const decodedString = parseJwt(targetImage.credential);
        setJsonData(decodedString);
				console.log('jsonData',jsonData);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };

    getData();
  }, [id,walletBackendUrl]);


	return (
    <Layout>
      <div className="px-4 sm:px-6">
    <div className="flex items-center">
      <Link to="/">
        <h1 className="text-2xl mb-2 font-bold text-gray-500">Credentials</h1>
      </Link>
      <BiRightArrowAlt className="mx-2 mb-2 text-2xl text-custom-blue" />
      <h1 className="text-2xl mb-2 font-bold text-custom-blue">Verifiable ID</h1>
				</div>

        <hr className="mb-2 border-t border-custom-blue/80" />
        <p className="italic text-gray-700">Search and choose an issuer for credential retrieval</p>
      </div>

			<div className="flex flex-col px-4 sm:px-6 mt-4">
  {/* Block 1: Image */}
  <div className='p-5'>
    {image && image.logoURL ? (
      <div 
			className="relative rounded-xl xl:w-1/3 md:w-3/5  overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full"
			onClick={() => setImageModalOpen(true)} // Open the modal when the image is clicked

			>
        <img src={image.logoURL} alt={image.logoURL} className="w-full object-cover rounded-xl" />

      </div>
    ) : (
      <p>No image available</p>
    )}
  </div>

  {/* Block 2: Information List */}
  <div className='p-5'>
    {image && (
      <ul >
        <li className="py-2">
          <span className="font-bold">Friendly Name:</span> {image.issuerFriendlyName}
        </li>
        <li className="py-2">
          <span className="font-bold">Url:</span> {image.issuerURL}
        </li>
      </ul>
    )}
    {jsonData && jsonData.vc && (
      <ul >
        <li className="py-2">
          <span className="font-bold">Expiration Date:</span> {jsonData.vc.expirationDate}
        </li>
      </ul>
    )}
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