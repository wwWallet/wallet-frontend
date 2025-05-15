// External libraries
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessageDots, faPlus, faSearch } from '@fortawesome/pro-regular-svg-icons';

// Contexts
import SessionContext from '@/context/SessionContext';
import CredentialsContext from '@/context/CredentialsContext';

// Hooks
import useScreenType from '@/hooks/useScreenType';
import useFetchPresentations from '@/hooks/useFetchPresentations';

// Components
import Slider from '@/components/Shared/Slider';
import { H1 } from '@/components/Shared/Heading';
import Button from '@/components/Buttons/Button';
import HistoryList from '@/components/History/HistoryList';
import { CredentialCardSkeleton } from '@/components/Skeletons';
import CredentialImage from '@/components/Credentials/CredentialImage';
import FilterSelector from '@/components/FilterSelector/FilterSelector';
import AddCredentialCard from '@/components/Credentials/AddCredentialCard';

const Home = () => {
	//General
	const navigate = useNavigate();
	const { t } = useTranslation();
	const screenType = useScreenType();
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api);
	const { vcEntityList, latestCredentials, getData, currentSlide, setCurrentSlide } = useContext(CredentialsContext);

	// State for filters
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedDateFilter, setSelectedDateFilter] = useState(6); // Default to "All time"
	const [selectedStatusFilter, setSelectedStatusFilter] = useState(0); // Default to "All statuses"
	const [selectedIssuerFilter, setSelectedIssuerFilter] = useState(0); // Default to "All issuers"
	const [filteredVcEntityList, setFilteredVcEntityList] = useState([]);

	console.log({vcEntityList})

	//Effects
	useEffect(() => {
		getData();
	}, [getData]);

	useEffect(() => {
		if (!vcEntityList) {
			return;
		}

		let filteredList = vcEntityList;

		// 1. Filter by search term
		if (searchTerm) {
			filteredList = filteredList.filter(vcEntity =>
				vcEntity?.parsedCredential?.metadata?.credential?.name
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) // Basic search by name
				// Add other fields to search by if needed, e.g., issuer, description
			);
		}

		// 2. Filter by date range
		// Placeholder: Actual date filtering logic will depend on your data structure
		// and how you want to interpret the filter values (0: "Last 3 days", etc.)
		// For example, if vcEntity has a 'issuanceDate' field:
		if (selectedDateFilter !== 6) { // Not "All time"
			const now = new Date();
			filteredList = filteredList.filter(vcEntity => {
				const issuanceDate = new Date(vcEntity?.parsedCredential?.credential?.issuanceDate || vcEntity?.issuanceDate || 0); // Adjust path as needed
				let daysToSubtract = 0;
				switch (selectedDateFilter) {
					case 0: daysToSubtract = 3; break;
					case 1: daysToSubtract = 7; break;
					case 2: daysToSubtract = 30; break;
					case 3: daysToSubtract = 90; break;
					case 5: daysToSubtract = 365; break;
					default: return true; // Should not happen if not "All time"
				}
				const pastDate = new Date();
				pastDate.setDate(now.getDate() - daysToSubtract);
				return issuanceDate >= pastDate;
			});
		}

		// 3. Filter by status
		// Placeholder: Actual status filtering logic will depend on your data structure
		// For example, if vcEntity has a 'status' field:
		if (selectedStatusFilter !== 0) { // Not "All statuses"
			filteredList = filteredList.filter(vcEntity => {
				const status = vcEntity?.credentialStatus || vcEntity?.parsedCredential?.credentialStatus; // Adjust path as needed
				switch (selectedStatusFilter) {
					case 1: return status === 'Active'; // Example status
					case 2: return status === 'Inactive';
					case 3: return status === 'Expired';
					default: return true;
				}
			});
		}

		// 4. Filter by issuer
		// Placeholder: Actual issuer filtering logic will depend on your data structure
		// For example, if vcEntity has an 'issuerName' or 'issuer' object:
		if (selectedIssuerFilter !== 0) { // Not "All issuers"
			const issuerOptions = [
				// Ensure these match the labels in FilterSelector EXACTLY if comparing by name
				"", "CISCO", "Microsoft", "Google", "Apple", "Facebook", "Amazon", "Twitter", "LinkedIn", "GitHub"
			];
			const selectedIssuerName = issuerOptions[selectedIssuerFilter];
			filteredList = filteredList.filter(vcEntity => {
				const issuer = vcEntity?.parsedCredential?.credential?.issuer?.name || vcEntity?.issuer?.name || vcEntity?.issuer; // Adjust path as needed
				return issuer?.toLowerCase() === selectedIssuerName?.toLowerCase();
			});
		}

		setFilteredVcEntityList(filteredList);
	}, [vcEntityList, searchTerm, selectedDateFilter, selectedStatusFilter, selectedIssuerFilter]);
	
	//Handlers
	const handleAddCredential = () => {
		navigate('/add');
	};

	const handleImageClick = (vcEntity) => {
		navigate(`/credential/${vcEntity.credentialIdentifier}`);
	};

	const handleSearchChange = (event) => {
		setSearchTerm(event.target.value);
	};

	const handleDateFilterChange = (value) => {
		setSelectedDateFilter(value);
	};

	const handleStatusFilterChange = (value) => {
		setSelectedStatusFilter(value);
	};

	const handleIssuerFilterChange = (value) => {
		setSelectedIssuerFilter(value);
	};

	const renderSlideContent = (vcEntity) => (
		<button
			id={`credential-slide-${vcEntity.id}`}
			key={vcEntity.id}
			className={`relative rounded-xl w-full cursor-pointer ${latestCredentials.has(vcEntity.id) ? 'fade-in' : ''}`}
			onClick={() => { handleImageClick(vcEntity); }}
			aria-label={`${vcEntity?.parsedCredential?.metadata?.credential?.name}`}
			tabIndex={currentSlide !== vcEntityList.indexOf(vcEntity) + 1 ? -1 : 0}
			title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: vcEntity?.parsedCredential?.metadata?.credential.name })}
		>
			<CredentialImage
				vcEntity={vcEntity}
				vcEntityInstances={vcEntity.instances}
				showRibbon={currentSlide === vcEntityList.indexOf(vcEntity) + 1}
				parsedCredential={vcEntity.parsedCredential}
				className={`w-full h-full object-cover rounded-xl ${latestCredentials.has(vcEntity.id) ? 'highlight-filter' : ''}`}
			/>
		</button>
	);

	//Render
	return ( 
		<div className="sm:px-12 pt-10 pb-20 w-full max-w-[1064px] mx-auto">
			<div className='flex items-center justify-between'>
				<div className='flex-1'>
					<h1 className="text-2xl font-semibold leading-tight tracking-tight text-c-lm-gray-900 md:text-3xl dark:text-c-dm-gray-100">
						{t('common.navItemCredentials')}
					</h1>

					<p className="mt-3 text-c-lm-gray-700 dark:text-c-dm-gray-300">
						{t('pageCredentials.description')}
					</p>
				</div>

				<Button
					id="logout"
					variant="tertiary"
					size='lg'
					textSize='md'
					disabled={vcEntityList?.length === 0}
					onClick={handleAddCredential}
				>
					<FontAwesomeIcon icon={faPlus} className="text-md mr-3" />

					{t('pageCredentials.addCredential')}
				</Button>
			</div>

			<div className='mt-11 flex items-center'>
				<div className="flex-5 relative">
					<label className="block" htmlFor={"search"}>
						<FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-[0.812rem] z-10 text-c-lm-gray-700 dark:text-c-dm-gray-300" />
					</label>

					<input
						className={`
							bg-c-lm-gray-200 dark:bg-c-dm-gray-800 border border-c-lm-gray-300 dark:border-c-dm-gray-700 
							dark:inputDarkModeOverride text-c-lm-gray-900 dark:text-c-dm-gray-100 rounded-lg w-full py-2 pl-10 pr-4
							outline-none focus:ring-2 ring-c-lm-blue dark:ring-c-dm-blue transition-shadow duration-200
							placeholder:text-c-lm-gray-700 dark:placeholder:text-c-dm-gray-300
						`}
						type="text"
						name="search"
						placeholder={t('pageCredentials.searchPlaceholder')}
						value={searchTerm}
						onChange={handleSearchChange}
						aria-label={"Search Credentials"}
						required={false}
					/>
				</div>
				
				<FilterSelector
					options={[
						{ value: 0, label: "Last 3 days" },
						{ value: 1, label: "Last 7 days" },
						{ value: 2, label: "Last 30 days" },
						{ value: 3, label: "Last 90 days" },
						{ value: 5, label: "Last 365 days" },
						{ value: 6, label: "All time" },
					]}
					currentValue={selectedDateFilter}
					onChange={handleDateFilterChange}
					className="flex-1 ml-2"
					horizontalPosition="left"
					listWidthClass="min-w-48"
				/>
				
				<FilterSelector
					options={[
						{ value: 0, label: "All statuses" },
						{ value: 1, label: "Active" },
						{ value: 2, label: "Inactive" },
						{ value: 3, label: "Expired" },
					]}
					currentValue={selectedStatusFilter}
					onChange={handleStatusFilterChange}
					className="flex-1 ml-2"
					horizontalPosition="left"
					listWidthClass="min-w-48"
				/>
				
				<FilterSelector
					options={[
						{ value: 0, label: "All issuers" },
						{ value: 1, label: "CISCO" },
						{ value: 2, label: "Microsoft" },
						{ value: 3, label: "Google" },
						{ value: 4, label: "Apple" },
						{ value: 5, label: "Facebook" },
						{ value: 6, label: "Amazon" },
						{ value: 7, label: "Twitter" },
						{ value: 8, label: "LinkedIn" },
						{ value: 9, label: "GitHub" },
					]}
					currentValue={selectedIssuerFilter}
					onChange={handleIssuerFilterChange}
					className="flex-1 ml-2"
					horizontalPosition="right"
					listWidthClass="min-w-48"
				/>
			</div>

			{vcEntityList ? 
				<div className='mt-6 overflow-x-hidden'>
					{filteredVcEntityList.length === 0 ?
						!searchTerm ?
							<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<AddCredentialCard onClick={handleAddCredential} />
								
							</div>
						:
							<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300 p-32 border border-c-lm-gray-300 dark:border-c-dm-gray-700 rounded-xl text-center">
								{t('pageCredentials.noResults')}
							</p>
					: screenType !== 'desktop' ?
						<div className='xm:px-4 px-12 sm:px-20'>
							<Slider
								items={filteredVcEntityList}
								renderSlideContent={renderSlideContent}
								initialSlide={currentSlide}
								onSlideChange={(currentIndex) => {
									const currentFilteredItem = filteredVcEntityList[currentIndex];
									const originalIndex = vcEntityList.findIndex(item => item.id === currentFilteredItem.id);
									setCurrentSlide(originalIndex + 1);
								}}
							/>

							{/* Update HistoryList based on current slide from filtered list */}
							{filteredVcEntityList[currentSlide -1 ] && vcEntityList.find(item => item.id === filteredVcEntityList[currentSlide -1]?.id) && (
								<HistoryList
									credentialId={filteredVcEntityList[currentSlide -1].credentialIdentifier}
									history={history}
									title="Recent History"
									limit={3}
								/>
							)}
						</div>
					: 
						<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 md:gap-4 lg:gap-4 lg:grid-cols-2 xl:grid-cols-3">
							{filteredVcEntityList && filteredVcEntityList.map((vcEntity) => (
								<button
									id={`credential-grid-${vcEntity.id}`}
									key={vcEntity.id}
									className={`relative rounded-xl cursor-pointer ${latestCredentials.has(vcEntity.id) ? 'highlight-border fade-in' : ''}`}
									onClick={() => handleImageClick(vcEntity)}
									aria-label={`${vcEntity?.parsedCredential?.metadata?.credential?.name}`}
									title={t('pageCredentials.credentialDetailsTitle', { friendlyName: vcEntity?.parsedCredential?.metadata?.credential?.name })}
								>
									<CredentialImage
										vcEntity={vcEntity}
										vcEntityInstances={vcEntity.instances}
										parsedCredential={vcEntity.parsedCredential}
										className={`w-full h-full object-cover rounded-xl ${latestCredentials.has(vcEntity.id) ? 'highlight-filter' : ''}`}
									/>
								</button>
							))}

							<AddCredentialCard onClick={handleAddCredential} />
						</div>
					}
				</div>
			:
				<div className="my-4 p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-12 xm:px-4 sm:px-20 md:px-0">
					{Array.from({ length: screenType !== 'desktop' ? 1 : 6 }).map((_, idx) => (
						<CredentialCardSkeleton key={idx} />
					))}
				</div>
			}
		</div>
	);
}

export default Home;
