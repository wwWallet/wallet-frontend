import React, { useEffect, useMemo, useState, useContext, useCallback } from 'react';
import PopupLayout from './PopupLayout';
import { FaRegCircle, FaCheckCircle, FaInfo, FaIdCard } from 'react-icons/fa';
import { useTranslation, Trans } from 'react-i18next';
import CredentialImage from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';
import Button from '../Buttons/Button';
import useScreenType from '../../hooks/useScreenType';
import Slider from '../Shared/Slider';
import CredentialCardSkeleton from '../Skeletons/CredentialCardSkeleton';
import { CredentialInfoSkeleton } from '../Skeletons';
import { truncateByWords } from '@/functions/truncateWords';
import { MdFactCheck } from "react-icons/md";
import { useCredentialName } from '@/hooks/useCredentialName';
import i18n from '@/i18n';

const prettyDomain = (raw) => {
	if (!raw) return '';
	let value = raw.trim();

	// Strip known prefixes
	if (value.startsWith('origin:')) value = value.slice(7);
	if (value.startsWith('x509_san_dns:')) value = value.slice(13);

	// Try to reduce to hostname if it's a URL
	try {
		const url = new URL(value);
		return url.host || value;
	} catch {
		return value;
	}
};

const SelectableCredentialSlideCard = ({
	vcEntity,
	isActive,
	isSelected,
	onClick
}) => {
	const { t } = useTranslation();
	const [imageLoaded, setImageLoaded] = useState(false);

	const credentialName = useCredentialName(
		vcEntity?.parsedCredential?.metadata?.credential?.name,
		vcEntity?.batchId,
		[i18n.language]
	);

	return (
		<button
			id={`slider-select-credentials-${vcEntity.batchId}`}
			className="relative w-full rounded-xl transition-shadow shadow-md hover:shadow-xl cursor-pointer"
			tabIndex={isActive ? 0 : -1}
			onClick={() => onClick(vcEntity.batchId)}
			aria-label={credentialName}
			title={t('selectCredentialPopup.credentialSelectTitle', {
				friendlyName: credentialName,
			})}
		>
			<CredentialImage
				vcEntity={vcEntity}
				vcEntityInstances={vcEntity.instances}
				key={vcEntity.batchId}
				parsedCredential={vcEntity.parsedCredential}
				className="w-full object-cover rounded-xl"
				showRibbon={isActive}
				onLoad={() => setImageLoaded(true)}
			/>

			{imageLoaded && (
				<>
					<div
						className={`absolute inset-0 rounded-xl transition-opacity bg-white/50 ${isSelected ? 'opacity-0' : 'opacity-50'
							}`}
					/>
					<div className="absolute bottom-4 right-4 z-60">
						{isSelected ? (
							<FaCheckCircle
								size={30}
								className="z-50 rounded-full bg-white text-primary dark:text-primary-light"
							/>
						) : (
							<FaRegCircle
								size={30}
								className="z-50 rounded-full bg-white/50 text-primary dark:text-primary-light"
							/>
						)}
					</div>
				</>
			)}
		</button>
	);
};

const formatTitle = (title) => {
	if (title) {
		return title.replace(/([a-z])([A-Z])/g, '$1 $2');
	} else {
		return;
	}
};

const normalizePath = (path) => {
	if (Array.isArray(path)) return path;
	if (typeof path === 'string' && path.startsWith('$.')) {
		return path.slice(2).split('.');
	}
	return [path];
};

const StepBar = ({ totalSteps, currentStep, stepTitles }) => {

	return (
		<div className="flex items-center justify-center w-full mb-2">
			{Array.from({ length: totalSteps }, (_, index) => {
				const isActive = index + 1 < currentStep;
				const isCurrent = index + 1 === currentStep;
				return (
					<React.Fragment key={index}>
						<div className="flex flex-col items-center">
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive
									? 'text-white bg-primary dark:bg-primary-light border-2 border-primary dark:border-primary-light'
									: isCurrent
										? 'text-primary dark:text-white dark:bg-gray-700 border-2 border-primary dark:border-primary-light'
										: 'text-gray-400 border-2 border-gray-400 dark:border-gray-400'
									}`}
							>
								{index === 0 ? (
									<FaInfo className="text-sm" />
								) : index === totalSteps - 1 ? (
									<MdFactCheck className="text-lg" />
								) : (
									<FaIdCard className="text-base" />
								)}
							</div>
						</div>
						{index < totalSteps - 1 && (
							<div className="flex-auto h-[2px] bg-gray-400">
								<div
									className={`h-[2px] ${isActive ? 'bg-primary dark:bg-primary-light' : ''} transition-all duration-300`}
									style={{ width: isActive ? '100%' : '0%' }}
								></div>
							</div>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
};

const StepTitle = ({ currentKey, t }) => {
	let icon = <FaIdCard className="w-[1.5rem] h-[1.5rem] shrink-0 align-text-bottom" />;
	let text = t('selectCredentialPopup.selectTitle');

	if (currentKey === 'preview') {
		icon = <FaInfo className="w-[1.25rem] h-[1.25rem] shrink-0 align-text-bottom" />;
		text = t('selectCredentialPopup.previewTitle');
	} else if (currentKey === 'summary') {
		icon = <MdFactCheck className="w-[1.5rem] h-[1.5rem] shrink-0 align-text-bottom" />;
		text = t('selectCredentialPopup.summaryTitle');
	}

	return (
		<h2 className="text-lg font-bold mb-2 text-primary dark:text-white flex flex-wrap items-center gap-2 leading-tight">
			<span className="inline-flex items-center gap-2">
				{icon}
				{t('selectCredentialPopup.baseTitle')} - {text}
			</span>
		</h2>
	);
};

function SelectCredentialsPopup({ popupState, setPopupState, showPopup, hidePopup, vcEntityList }) {

	const [vcEntities, setVcEntities] = useState(null);
	const { t } = useTranslation();
	const rawKeys = useMemo(() => popupState?.options ? Object.keys(popupState.options.conformantCredentialsMap) : [], [popupState]);
	const keys = useMemo(() => ['preview', ...rawKeys, 'summary'], [rawKeys]);
	const stepTitles = useMemo(() => keys, [keys]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [currentSelectionMap, setCurrentSelectionMap] = useState({});
	const [showFullPurpose, setShowFullPurpose] = useState(false);
	const [selectedCredential, setSelectedCredential] = useState(null);
	const screenType = useScreenType();
	const [currentSlide, setCurrentSlide] = useState(1);
	const [currentSummarySlide, setCurrentSummarySlide] = useState(0);

	const requestedFieldsPerCredential = useMemo(() => {

		if (!popupState?.options) return {};
		const map = popupState.options.conformantCredentialsMap;
		const result = {};
		for (const [descriptorId, entry] of Object.entries(map)) {
			const seen = new Set();
			result[descriptorId] = (entry.requestedFields || []).filter(field => {
				const key = field.name || field.path?.join('.');
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			});
		}
		return result;
	}, [popupState]);

	const reinitialize = useCallback(() => {
		setCurrentIndex(0);
		setCurrentSlide(1);
		setCurrentSelectionMap({});
		setSelectedCredential(null);
		setPopupState((current) => ({ ...current, isOpen: false }));
	}, [setPopupState]);

	useEffect(() => {
		const getData = async () => {
			const currentKey = keys[currentIndex];
			if (currentIndex === Object.keys(popupState.options.conformantCredentialsMap).length + 2) {
				reinitialize();
				popupState.resolve(new Map(Object.entries(currentSelectionMap)));
				return;
			}

			if (currentKey === 'preview' || currentKey === 'summary') {
				if (!vcEntities?.length || currentKey !== keys[currentIndex]) {
					setVcEntities([]);
				}
				return;
			}
			try {
				const filteredVcEntities = vcEntityList.filter(vcEntity =>
					popupState.options.conformantCredentialsMap[keys[currentIndex]].credentials.includes(vcEntity.batchId)
				);
				setVcEntities(filteredVcEntities);
			} catch (error) {
				console.error('Failed to fetch data', error);
			}
		};

		if (popupState?.options && vcEntityList) {
			console.log("opts = ", popupState.options)
			getData();
		}
	}, [
		currentIndex,
		currentSelectionMap,
		keys,
		popupState,
		vcEntityList,
		reinitialize
	]);

	useEffect(() => {
		if (popupState?.options) {
			const currentKey = keys[currentIndex];
			const selectedId = currentSelectionMap[currentKey];
			setSelectedCredential(selectedId);
		}
	}, [currentIndex, currentSelectionMap, keys, popupState]);

	const selectedVcEntities = useMemo(() => {
		if (!vcEntityList || !currentSelectionMap) return [];

		return Object.values(currentSelectionMap)
			.map((selectedId) =>
				vcEntityList.find((vc) => vc.batchId === selectedId)
			)
			.filter(Boolean);
	}, [currentSelectionMap, vcEntityList]);

	const goToNextSelection = () => {
		if (keys[currentIndex] === 'summary') {
			popupState.resolve(new Map(Object.entries(currentSelectionMap)));
			reinitialize();
		} else {
			setCurrentIndex(i => i + 1);
		}
	}

	const goToPreviousSelection = () => {
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		}
	};

	const handleClick = (batchId) => {
		const descriptorId = keys[currentIndex];
		if (selectedCredential === batchId) {
			setSelectedCredential(null);
			setCurrentSelectionMap((prev) => ({ ...prev, [descriptorId]: undefined }));
		} else {
			setSelectedCredential(batchId);
			setCurrentSelectionMap((prev) => ({ ...prev, [descriptorId]: batchId }));
		}
	};

	const onClose = () => {
		// setIsOpen(false);
		popupState.reject();
		reinitialize();
		// navigate('/');
	}

	if (!popupState?.isOpen) {
		return null;
	};

	return (
		<PopupLayout isOpen={popupState?.isOpen} onClose={onClose} loading={false} fullScreen={screenType !== 'desktop'} padding="p-0" shouldCloseOnOverlayClick={false}>
			<div className={`${screenType === 'desktop' && 'p-4'}`}>

				{keys.length > 1 && (
					<StepBar totalSteps={keys.length} currentStep={currentIndex + 1} stepTitles={stepTitles} />
				)}
				{stepTitles && (
					<StepTitle currentKey={keys[currentIndex]} t={t} />
				)}
				<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />

				{/* Preview step */}
				{keys[currentIndex] === 'preview' && (
					<>
						<p className="text-gray-700 italic dark:text-white text-sm mt-3 mb-2">
							{t('selectCredentialPopup.previewDescription')}
						</p>
						<div className="flex flex-col gap-2">

							{popupState?.options?.verifierDomainName && (
								<div className="flex flex-wrap gap-1 items-center text-gray-700 text-sm dark:text-white">
									<span className="text-primary text-sm font-bold dark:text-white block">
										{t('selectCredentialPopup.requestingParty')}
									</span>
									<span className="w-max font-semibold text-primary dark:text-white rounded border border-primary dark:border-white p-1 break-all block">
										{prettyDomain(popupState.options.verifierDomainName)}
									</span>
								</div>
							)}
							{popupState.options.verifierPurpose && (() => {
								const { text: truncatedText, truncated } = truncateByWords(popupState.options.verifierPurpose, 40);
								const textToDisplay = showFullPurpose ? popupState.options.verifierPurpose : truncatedText;

								return (
									<p className="pd-2 text-gray-700 text-sm dark:text-white">
										<span className="text-primary text-sm font-bold dark:text-white">
											{t('selectCredentialPopup.purpose')}
										</span>
										<span className="font-medium">
											{textToDisplay}
										</span>
										{truncated && (
											<>
												{' '}
												<button
													onClick={() => setShowFullPurpose(!showFullPurpose)}
													className="text-primary dark:text-extra-light font-medium hover:underline inline"
												>
													{showFullPurpose ? t('common.showLess') : t('common.showMore')}
												</button>
											</>
										)}
									</p>
								);
							})()}

							{popupState?.options?.parsedTransactionData && popupState?.options?.parsedTransactionData.map((txData) => {
								const TxComp = txData.ui;
								return (<TxComp />)
							})}

							<div>
								<p className="text-primary dark:text-white text-sm font-bold">
									{t('selectCredentialPopup.requestedCredentialsFieldsTitle')}
								</p>
								{Object.entries(requestedFieldsPerCredential).map(([descriptorId, fields]) => {
									return (
										<div key={descriptorId} className="my">
											<div className="flex flex-row gap-1 text-sm text-gray-700 dark:text-white my-1">
												<span className="flex items-center gap-1 font-bold">
													<FaIdCard className="text-primary dark:text-primary-light" />
													{t('selectCredentialPopup.request')}
												</span>
												<span
													title={descriptorId}
													className="font-semibold bg-gray-100 dark:bg-gray-600 px-1 rounded border border-gray-400 break-all truncate whitespace-nowrap overflow-hidden flex-1 min-w-0 max-w-max"
												>
													{descriptorId}
												</span>
											</div>
											<p className="text-sm text-gray-700 font-normal dark:text-white list-disc ml-4">
												{!fields[0].path[0] ? (
													<span>
														{t('selectCredentialPopup.allClaimsRequested')}
													</span>
												) : (
													<span>
														{t('selectCredentialPopup.specificClaimsRequested')}
													</span>
												)}
											</p>
										</div>
									);
								})}
							</div>
						</div>

					</>
				)}

				{/* Selection step */}
				{keys[currentIndex] !== 'preview' && keys[currentIndex] !== 'summary' && (
					<>
						<p className="text-gray-700 italic dark:text-white text-sm mt-3 mb-4">
							{t('selectCredentialPopup.selectDescription')}
						</p>
						<div>
						</div>
						<div className={`${screenType === 'desktop' && 'm-auto max-w-[700px]'}`}>
							{vcEntities && vcEntities.length ? (
								<Slider
									items={vcEntities}
									renderSlideContent={(vcEntity, index) => (
										<SelectableCredentialSlideCard
											key={vcEntity.batchId}
											vcEntity={vcEntity}
											isActive={currentSlide === index + 1}
											isSelected={selectedCredential === vcEntity.batchId}
											onClick={handleClick}
										/>
									)}
									onSlideChange={(currentIndex) => setCurrentSlide(currentIndex + 1)}
									className='xm:px-4 px-16 sm:px-24 md:px-8'
								/>
							) : (
								<CredentialCardSkeleton />

							)}
							{vcEntities?.[currentSlide - 1] ? (
								<div className="flex flex-wrap justify-center flex flex-row justify-center items-center my-2">
									<CredentialInfo
										parsedCredential={vcEntities[currentSlide - 1].parsedCredential}
										mainClassName={"text-xs w-full"}
										requested={{
											fields: requestedFieldsPerCredential[keys[currentIndex]]?.map(field => normalizePath(field.path)),
											display: "highlight"
										}}
									/>
								</div>
							) : (
								<div className="mt-2">
									<CredentialInfoSkeleton />
								</div>
							)}
						</div>
					</>
				)}

				{/* Summary step */}
				{keys[currentIndex] === 'summary' && (
					<>
						<p className="text-gray-700 italic dark:text-white text-sm mt-3 mb-4">
							<Trans
								i18nKey="selectCredentialPopup.summaryDescription"
								components={{ strong: <strong /> }}
							/>
						</p>

						{popupState?.options?.parsedTransactionData && popupState?.options?.parsedTransactionData.map((txData) => {
							const TxComp = txData.ui;
							return <TxComp />
						})}

						<div className={`${screenType === 'desktop' && 'max-w-[600px]'}`}>
							<Slider
								items={selectedVcEntities}
								renderSlideContent={(vcEntity, i) => {
									const descriptorId = Object.keys(currentSelectionMap).find(
										(key) => currentSelectionMap[key] === vcEntity.batchId
									);

									const fields = requestedFieldsPerCredential[descriptorId];
									const hasValidPath = Array.isArray(fields) && fields[0]?.path[0];

									const requiredClaimPaths = (vcEntity.parsedCredential.metadata.credential?.TypeMetadata?.claims ?? [])
										.filter(c => c?.required === true)
										.map(c => normalizePath(c.path));

									// Only merge when hasValidPath is true, otherwise leave undefined
									const filterPaths = hasValidPath
										? Array.from(
											new Set([
												...fields.map(f => JSON.stringify(normalizePath(f.path))),
												...requiredClaimPaths.map(p => JSON.stringify(p))
											])
										).map(p => JSON.parse(p))
										: undefined;

									return (
										<div className='py-1 w-full'>
											<CredentialImage
												vcEntity={vcEntity}
												vcEntityInstances={vcEntity.instances}
												parsedCredential={vcEntity.parsedCredential}
												className="w-full object-cover rounded-xl"
												showRibbon={currentSummarySlide === i}
												filter={filterPaths}
											/>
										</div>
									);
								}}
								onSlideChange={(index) => setCurrentSummarySlide(index)}
								className='xm:px-4 px-16 sm:px-24 md:px-8'
							/>

							{selectedVcEntities?.[currentSummarySlide] ? (
								<div className="flex flex-wrap justify-center items-center my-2">
									<CredentialInfo
										parsedCredential={selectedVcEntities[currentSummarySlide].parsedCredential}
										mainClassName="text-xs w-full"
										requested={{
											fields: requestedFieldsPerCredential[
												Object.keys(currentSelectionMap).find(
													(key) =>
														currentSelectionMap[key] ===
														selectedVcEntities[currentSummarySlide]?.batchId
												)
											]?.map((field) => normalizePath(field.path)),
											display: "hide"
										}}
									/>
								</div>
							) : (
								<CredentialInfoSkeleton />
							)}
						</div>
					</>
				)}
			</div>

			<div
				className={`z-10 left-0 right-0 bg-white dark:bg-gray-800 shadow-2xl rounded-t-lg flex justify-between ${screenType === 'desktop'
					? 'sticky bottom-0 px-4 py-3'
					: 'fixed bottom-0 px-6 pb-4 pt-4'
					}`}
			>
				<Button
					id="cancel-select-credentials"
					onClick={onClose}
					variant="cancel"
					className="mr-2"
				>
					{t('common.cancel')}
				</Button>

				<div className="flex gap-2">
					{currentIndex > 0 && (
						<Button
							id="previous-select-credentials"
							variant="secondary"
							onClick={goToPreviousSelection}>
							{t('common.previous')}
						</Button>
					)}

					<Button
						id={`${keys[currentIndex] === 'summary' ? 'send' : 'next'}-select-credentials`}
						onClick={goToNextSelection}
						variant="primary"
						disabled={keys[currentIndex] !== 'summary' && keys[currentIndex] !== 'preview' && selectedCredential == undefined}
						title={selectedCredential == undefined && keys[currentIndex] !== 'summary' && keys[currentIndex] !== 'preview'
							? t('selectCredentialPopup.nextButtonDisabledTitle') : ''}
					>
						{keys[currentIndex] === 'summary'
							? t('common.navItemSendCredentialsSimple')
							: t('common.next')}
					</Button>
				</div>
			</div>
		</PopupLayout >
	);
}

export default SelectCredentialsPopup;
