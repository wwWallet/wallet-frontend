import React, { useState, useEffect, useRef } from 'react';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';

import Slider from 'react-slick';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

import { useApi } from '../../api';

import { fetchCredentialData } from '../../components/Credentials/ApiFetchCredential';
import CredentialInfo from '../../components/Credentials/CredentialInfo';
import {formatDate} from '../../functions/DateFormat';


const History = () => {
  const api = useApi();
  const [history, setHistory] = useState([]);
  const [matchingCredentials, setMatchingCredentials] = useState([]);
	const [isImageModalOpen, setImageModalOpen] = useState(false);

	const [currentSlide, setCurrentSlide] = useState(1);

	const { t } = useTranslation();

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

    // Fetch all credentials
    const temp_cred = await fetchCredentialData(api);

    // Filter credentials to keep only those with matching IDs in ivci
    const matchingCreds = temp_cred.filter((cred) => ivci.includes(cred.credentialIdentifier));

    // Set matching credentials and show the popup
    setMatchingCredentials(matchingCreds);
    setImageModalOpen(true);
  };

  useEffect(() => {
    const fetchedPresentations = async () => {
      try {
        const fetchedPresentations = await api.getAllPresentations();
				console.log(fetchedPresentations.vp_list);
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

    fetchedPresentations();
  }, [api]);

  return (
    <>
      <div className="sm:px-6 w-full">
        <h1 className="text-2xl mb-2 font-bold text-custom-blue">{t('common.navItemHistory')}</h1>
        <hr className="mb-2 border-t border-custom-blue/80" />
        <p className="step-2 italic pd-2 text-gray-700">
					{t('pageHistory.description')}
        </p>

				{history.length === 0 ? (
          <p className="text-gray-700 mt-4">
						{t('pageHistory.noFound')}
					</p>
        ) : (
					<div className="my-4 overflow-auto space-y-2" style={{ maxHeight: '85vh' }}>

          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 break-words"
              style={{ wordBreak: 'break-all' }}
              onClick={() => handleHistoryItemClick(item.ivci)}
            >
              <div className="font-bold">{item.audience}</div>
							<div>{formatDate(new Date(item.issuanceDate * 1000).toISOString())}</div>
            </div>
          ))}
        </div>
        )}
      </div>

      {isImageModalOpen && (
				<div className="fixed inset-0 flex items-center justify-center z-50" >
  				<div className="absolute inset-0 bg-black opacity-50" onClick={() => setImageModalOpen(false)}></div>
					<div className="bg-white p-4 rounded-lg shadow-lg w-[99%] lg:w-[33.33%] sm:w-[33.33%] max-h-[100vh] z-10 relative mx-6 mx-4">
						
						{/* Popup content */}
						<div class="flex items-start justify-between border-b rounded-t dark:border-gray-600">
							<h2 className="right text-lg font-bold p-2 mb-2 text-custom-blue">
								{t('pageHistory.popupTitle')}
							</h2>
							<button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={() => setImageModalOpen(false)}>
								<svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
										<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
								</svg>
							</button>
            </div>
						<hr className="mb-2 border-t border-custom-blue/80" />

						{/* Display presented credentials */}
						<div className=" p-2">
							<Slider ref={sliderRef} {...settings}>
							{matchingCredentials.map((credential) => (
								<React.Fragment key={credential.id}>
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
								</React.Fragment>
							))}
							</Slider>
						</div>
					</div>
				</div>	
      )}
    </>
  );
};

export default History;
