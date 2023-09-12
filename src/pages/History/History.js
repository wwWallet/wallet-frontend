import React, { useState, useEffect, useRef } from 'react';
import * as api from '../../api';

import Layout from '../../components/Layout';
import { fetchCredentialData } from '../../components/Credentials/ApiFetchCredential';
import { AiOutlineCloseCircle } from 'react-icons/ai';

import { useNavigate } from 'react-router-dom';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

import CredentialInfo from '../../components/Credentials/CredentialInfo';

const History = () => {
  const [history, setHistory] = useState([]);
  const [matchingCredentials, setMatchingCredentials] = useState([]);
	const [isImageModalOpen, setImageModalOpen] = useState(false);

	const [currentSlide, setCurrentSlide] = useState(1);

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

  const handleHistoryItemClick = async (ivci) => {
    ivci = [...ivci, '1']; // Add a new value to ivci

    // Fetch all credentials
    const temp_cred = await fetchCredentialData();

    // Filter credentials to keep only those with matching IDs in ivci
    const matchingCreds = temp_cred.filter((cred) => ivci.includes(cred.credentialIdentifier));

    // Set matching credentials and show the popup
    setMatchingCredentials(matchingCreds);
    setImageModalOpen(true);
  };

  useEffect(() => {
    const fetchVerifiers = async () => {
      try {
        const fetchedPresentations = await api.getAllPresentations();
        // Extract and map the vp_list from fetchedPresentations.
        const vpListFromApi = fetchedPresentations.vp_list.map((item) => ({
          id: item.id,
          ivci: item.includedVerifiableCredentialIdentifiers,
          audience: item.audience,
          issuanceDate: item.issuanceDate,
        }));

        setHistory(vpListFromApi);
      } catch (error) {
        console.error('Error fetching verifiers:', error);
      }
    };

    fetchVerifiers();
  }, []);

  return (
    <Layout>
      <div className="px-4 sm:px-6 w-full">
        <h1 className="text-2xl mb-2 font-bold text-custom-blue">History</h1>
        <hr className="mb-2 border-t border-custom-blue/80" />
        <p className="italic pd-2 text-gray-700">
          View history of credential transmissions, detailing when and to which verifiers you sent
        </p>

        <div className="my-4 overflow-auto space-y-2" style={{ maxHeight: '85vh' }}>
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 break-words"
              style={{ wordBreak: 'break-all' }}
              onClick={() => handleHistoryItemClick(item.ivci)}
            >
              <div className="font-bold">{item.audience}</div>
              <div>{new Date(item.issuanceDate).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>

      {isImageModalOpen && (
				<div className="fixed inset-0 flex items-center justify-center z-50">
  				<div className="absolute inset-0 bg-black opacity-50"></div>
					<div className="bg-white p-4 rounded-lg shadow-lg w-[99%] lg:w-[33.33%] sm:w-[66.67%] max-h-[80vh] z-10 relative mx-6 mx-4">
						{/* Popup content */}
						<h2 className="text-lg font-bold mb-2 text-custom-blue">
							Presented Credentials
						</h2>
						<hr className="mb-2 border-t border-custom-blue/80" />

						{/* Display presented credentials */}
						<div className=" p-2">
							<Slider ref={sliderRef} {...settings}>
							{matchingCredentials.map((credential) => (
								<>
									<div className="relative rounded-xl xl:w-full md:w-full  sm:w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full">
										<img src={credential.src} alt={credential.alt} className="w-full object-cover rounded-xl" />
									</div>
									<div className="flex items-center justify-end mt-2 mr-3">
										<span className="mr-4">{currentSlide} of {matchingCredentials.length}</span>
										<button className="" onClick={() => sliderRef.current.slickPrev()}>
											<BiLeftArrow size={22} />
										</button>
										<button onClick={() => sliderRef.current.slickNext()}>
											<BiRightArrow size={22} />
										</button>
									</div>
									<div className="max-h-[30vh] overflow-y-auto mx-2">
									<CredentialInfo credential={credential} />
									</div>
								</>
							))}
							</Slider>
						</div>
					</div>

					<button
						className="absolute top-4 right-2  text-white text-2xl z-10"
						onClick={() => setImageModalOpen(false)}
					>
						<AiOutlineCloseCircle size={40} />
					</button>
				</div>	
      )}
    </Layout>
  );
};

export default History;
