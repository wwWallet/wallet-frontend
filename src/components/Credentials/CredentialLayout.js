// External libraries
import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

// Hooks
import useScreenType from '../../hooks/useScreenType';

// Contexts
import SessionContext from '../../context/SessionContext';
import ContainerContext from '../../context/ContainerContext';

// Components
import { H1 } from '../Shared/Heading';
import CredentialImage from './CredentialImage';
import FullscreenPopup from '../Popups/FullscreenImg';
import PageDescription from '../Shared/PageDescription';

const CredentialLayout = ({ children }) => {
	const { credentialId } = useParams();
	const { api } = useContext(SessionContext);
	const container = useContext(ContainerContext);
	const screenType = useScreenType();
	const [vcEntity, setVcEntity] = useState(null);
	const [showFullscreenImgPopup, setShowFullscreenImgPopup] = useState(false);
	const [credentialFiendlyName, setCredentialFriendlyName] = useState(null);
	const { t } = useTranslation();
	const navigate = useNavigate();

	useEffect(() => {
		const getData = async () => {
			const response = await api.get('/storage/vc');
			const vcEntity = response.data.vc_list
				.filter((vcEntity) => vcEntity.credentialId === credentialId)[0];
			if (!vcEntity) {
				throw new Error("Credential not found");
			}
			setVcEntity(vcEntity);
		};

		getData();
	}, [api, credentialId]);

	useEffect(() => {
		if (!vcEntity) {
			return;
		}
		container.credentialParserRegistry.parse(vcEntity.credential).then((c) => {
			if ('error' in c) {
				return;
			}
			setCredentialFriendlyName(c.credentialFriendlyName);
		});
	}, [vcEntity, container]);

	return (
		<div className=" sm:px-6">
			{screenType !== 'mobile' ? (
				<H1
					heading={<Link to="/">{t('common.navItemCredentials')}</Link>}
					flexJustifyContent="start"
					textColorClass="text-gray-500 hover:text-primary dark:text-primary-light dark:hover:text-primary-light hover:underline"
				>
					<FaArrowRight size={20} className="mx-2 text-2xl mb-2 text-primary dark:text-primary-light" />

					{vcEntity && (
						<H1 heading={credentialFiendlyName} hr={false} />
					)}
				</H1>
			) : (
				<button onClick={() => navigate(-1)} className="mr-2 mb-2" aria-label="Go back to the previous page">
					<FaArrowLeft size={20} className="text-2xl text-primary dark:text-primary-light" />
				</button>
			)}
			<PageDescription description={t('pageCredentials.details.description')} />

			<div className="flex flex-wrap mt-0 lg:mt-5">
				{/* Block 1: credential */}
				<div className='flex flex-row w-full md:w-1/2'>
					<div className='flex flex-row items-center gap-5 mt-2 mb-4 px-2'>
						{vcEntity && (
							// Open the modal when the credential is clicked
							<button className="relative rounded-xl xm:rounded-lg w-4/5 xm:w-4/12 overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full"
								onClick={() => setShowFullscreenImgPopup(true)}
								aria-label={`${credentialFiendlyName}`}
								title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: credentialFiendlyName })}
							>
								<CredentialImage credential={vcEntity.credential} className={"w-full object-cover"} />
							</button>
						)}
						<div>
							{screenType === 'mobile' && (
								<p className='text-xl font-bold text-primary dark:text-white'>{credentialFiendlyName}</p>
							)}
						</div>
					</div>
				</div>

				{children}
			</div>
			{/* Fullscreen credential Popup*/}
			{showFullscreenImgPopup && vcEntity && (
				<FullscreenPopup
					isOpen={showFullscreenImgPopup}
					onClose={() => setShowFullscreenImgPopup(false)}
					content={
						<CredentialImage credential={vcEntity.credential} className={"max-w-full max-h-full rounded-xl"} showRibbon={false} />
					}
				/>
			)}
		</div>
	);
};

export default CredentialLayout;
