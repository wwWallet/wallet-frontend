import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { DcqlMatches, DcqlSelection, DcqlSelectedCredential } from 'wallet-common';
import { ChevronDown } from 'lucide-react';
import PopupLayout from './PopupLayout';
import {
	MAX_REQUIRED_COMBINATIONS,
	completeRequiredCombinations,
	credentialImageFilter,
	disclosedDisplay,
	normalizeDcqlMatches,
	reconcileSelection,
	selectionIsValid,
} from './dcqlCredentialSelection';
import CredentialImage from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';
import Button from '../Buttons/Button';
import Slider from '../Shared/Slider';
import useScreenType from '@/hooks/useScreenType';
import { useCredentialName } from '@/hooks/useCredentialName';
import { prettyDomain } from '@/utils';
import type { ExtendedVcEntity } from '@/context/CredentialsContext';
import type { CredentialSelectionPopupState, SetCredentialSelectionPopupState } from '@/types/credentialSelection';

interface Props {
	popupState: CredentialSelectionPopupState;
	setPopupState: SetCredentialSelectionPopupState;
	vcEntityList: ExtendedVcEntity[] | null;
}

const preferredLanguages = ['en-US'];

function RequestName({
	id,
	matches,
	inventory,
	prefix = '',
}: {
	id: string;
	matches: DcqlMatches;
	inventory: ExtendedVcEntity[] | null;
	prefix?: string;
}) {
	const { i18n: translator } = useTranslation();
	const credential = inventory?.find((vc) => matches[id]?.credentials.includes(vc.batchId));
	const languages = useMemo(() => [translator.language, ...preferredLanguages], [translator.language]);
	const name = useCredentialName(
		credential?.parsedCredential?.metadata?.credential?.name,
		credential?.batchId,
		languages,
	);
	return (
		<>
			{prefix}
			{name ?? id.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
		</>
	);
}

function DisclosurePreview({
	credential,
	instance,
}: {
	credential: ExtendedVcEntity;
	instance: DcqlSelectedCredential;
}) {
	const { allClaims, displayPaths } = disclosedDisplay(credential, instance);
	return (
		<div className="min-w-0">
			<div>
				<CredentialInfo
					parsedCredential={{ signedClaims: allClaims, metadata: credential.parsedCredential.metadata }}
					visibleFields={displayPaths}
					noInnerScroll
					stripedRows
					mainClassName="text-[13px] w-full"
				/>
			</div>
		</div>
	);
}

export default function DcqlCredentialsPopup({ popupState, setPopupState, vcEntityList }: Props) {
	const { t } = useTranslation();
	const screenType = useScreenType();
	const matches = useMemo(
		() => normalizeDcqlMatches(popupState.options?.conformantCredentialsMap ?? {}),
		[popupState.options],
	);
	const requirements = useMemo(() => Object.values(matches)[0]?.requirements ?? [], [matches]);
	const { combinations, truncated } = useMemo(
		() => completeRequiredCombinations(requirements, matches),
		[requirements, matches],
	);
	const hasRequiredSets = requirements.some((set) => set.required !== false);
	const hasOptionalChoices = requirements.some(
		(set) => set.required === false && set.options.some((option) => option.available),
	);
	const showSelectionStep = combinations.length !== 1 || hasOptionalChoices || !hasRequiredSets;
	const [choices, setChoices] = useState<(number | null)[]>([]);
	const [selection, setSelection] = useState<DcqlSelection>(new Map());
	const [stage, setStage] = useState<'combinations' | 'credentials' | 'review'>('combinations');
	const hasStartedReview = useRef(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const [slideById, setSlideById] = useState<Record<string, number>>({});
	const [expanded, setExpanded] = useState<string | null>(null);
	const [reviewed, setReviewed] = useState(false);
	const [emptyResponseAttention, setEmptyResponseAttention] = useState(false);
	const [consentAttention, setConsentAttention] = useState(false);
	const consentRef = useRef<HTMLInputElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const activePanelRef = useRef<HTMLElement>(null);
	const alignActivePanelRef = useRef(false);
	const reviewHeaderRefs = useRef<Record<string, HTMLButtonElement | null>>({});

	useEffect(() => {
		if (!popupState.isOpen || !popupState.options) return;
		const defaults = combinations[0]?.choices ?? requirements.map(() => null);
		setChoices(defaults);
		const initial = reconcileSelection(matches, defaults, new Map(), vcEntityList);
		setSelection(
			showSelectionStep
				? initial
				: new Map([...initial].map(([id, instances]) => [id, matches[id].candidates.length === 1 ? instances : []])),
		);
		setStage(showSelectionStep ? 'combinations' : 'credentials');
		hasStartedReview.current = false;
		setActiveIndex(0);
		setSlideById({});
		setExpanded(null);
		setReviewed(false);
		setEmptyResponseAttention(false);
		setConsentAttention(false);
		// A newly opened request has new matches; inventory changes while open should
		// not discard a user's choices.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [popupState.options, popupState.isOpen, requirements, combinations, showSelectionStep]);

	const valid = combinations.length > 0 && selectionIsValid(matches, choices, selection, vcEntityList);
	const combinationValid =
		combinations.length > 0 &&
		selectionIsValid(
			matches,
			choices,
			new Map(
				[...selection].map(([id, instances]) => [
					id,
					instances.length ? instances : matches[id].candidates.slice(0, 1),
				]),
			),
			vcEntityList,
		);
	const currentStep = stage === 'combinations' ? 0 : 1;
	const finalReview = stage === 'review';
	const combinationIndex = Math.max(
		0,
		combinations.findIndex((combination) =>
			combination.choices.every((choice, index) => requirements[index].required === false || choices[index] === choice),
		),
	);
	const chooseCombination = (index: number) => {
		const next = combinations[index].choices.map((choice, i) =>
			requirements[i].required === false ? choices[i] : choice,
		);
		setChoices(next);
		setSelection((previous) => reconcileSelection(matches, next, previous, vcEntityList));
		setReviewed(false);
		setEmptyResponseAttention(false);
	};
	const chooseOption = (index: number, optionIndex: number | null) => {
		const next = choices.map((choice, i) => (i === index ? optionIndex : choice));
		setChoices(next);
		setSelection((previous) => reconcileSelection(matches, next, previous, vcEntityList));
		setReviewed(false);
		setEmptyResponseAttention(false);
	};
	const startCredentialReview = () => {
		alignActivePanelRef.current = true;
		if (!hasStartedReview.current) {
			setSelection(
				(previous) =>
					new Map([...previous].map(([id, instances]) => [id, matches[id].candidates.length === 1 ? instances : []])),
			);
			setActiveIndex(0);
			hasStartedReview.current = true;
		}
		setStage('credentials');
	};
	const setCredentialChoice = (id: string, candidate: DcqlSelectedCredential) => {
		setSelection((previous) => {
			const next = new Map(previous);
			const current = previous.get(id) ?? [];
			next.set(
				id,
				matches[id].multiple
					? current.some((item) => item.batchId === candidate.batchId)
						? current.filter((item) => item.batchId !== candidate.batchId)
						: [...current, candidate]
					: [candidate],
			);
			return next;
		});
		setReviewed(false);
	};
	const setAllCredentials = (id: string, all: boolean) => {
		setSelection((previous) => new Map(previous).set(id, all ? [...matches[id].candidates] : []));
		setReviewed(false);
	};
	const toggleReviewDetails = (id: string) => {
		if (expanded === id) {
			setExpanded(null);
			return;
		}
		const selected = selection.get(id)?.[0];
		const index = matches[id].candidates.findIndex((candidate) => candidate === selected);
		setSlideById((previous) => ({ ...previous, [id]: Math.max(0, index) }));
		setExpanded(id);
	};
	const close = () => {
		popupState.reject();
		setPopupState((current) => ({ ...current, isOpen: false }));
	};
	const optionalChoices = (
		<>
			{hasOptionalChoices && <hr className="border-lm-gray-400 dark:border-dm-gray-600" />}
			{requirements.map((set, index) => {
				if (set.required !== false) return null;
				const available = set.options.filter((option) => option.available);
				if (!available.length) return null;
				return (
					<section key={set.setIndex} className="space-y-3">
						{index ===
							requirements.findIndex(
								(item) => item.required === false && item.options.some((option) => option.available),
							) && <h3 className="text-base font-semibold">{t('dcqlCredentials.optionalInformation')}</h3>}
						<label className="flex items-center gap-3 pl-4 text-sm cursor-pointer">
							<input
								type="checkbox"
								className="h-4 w-4 shrink-0 accent-primary"
								checked={choices[index] != null}
								onChange={(event) =>
									chooseOption(index, event.target.checked ? (choices[index] ?? available[0].optionIndex) : null)
								}
							/>
							{available.length === 1
								? available[0].queryIds.map((id, i) => (
										<span key={id}>
											{i > 0 && ' + '}
											<RequestName id={id} matches={matches} inventory={vcEntityList} />
										</span>
									))
								: t('dcqlCredentials.includeOptional')}
						</label>
						{available.length > 1 && choices[index] !== null && (
							<select
								aria-label={t('dcqlCredentials.optionalCredentialOption')}
								className="ml-11 rounded border border-lm-gray-400 bg-lm-gray-100 p-2 dark:border-dm-gray-600 dark:bg-dm-gray-900"
								value={choices[index] ?? available[0].optionIndex}
								onChange={(event) => chooseOption(index, Number(event.target.value))}
							>
								{available.map((option) => (
									<option key={option.optionIndex} value={option.optionIndex}>
										{option.queryIds.map((id, i) => (
											<RequestName
												key={id}
												id={id}
												matches={matches}
												inventory={vcEntityList}
												prefix={i ? ' + ' : ''}
											/>
										))}
									</option>
								))}
							</select>
						)}
					</section>
				);
			})}
		</>
	);
	const activeIds = [...selection.keys()];
	const activeId = activeIds[Math.min(activeIndex, Math.max(0, activeIds.length - 1))];
	useLayoutEffect(() => {
		if (!alignActivePanelRef.current || currentStep !== 1 || finalReview) return;
		const container = scrollContainerRef.current;
		const panel = activePanelRef.current;
		if (!container || !panel) return;
		alignActivePanelRef.current = false;
		const nextTop = container.scrollTop + panel.getBoundingClientRect().top - container.getBoundingClientRect().top;
		container.scrollTop = Math.max(0, Math.min(nextTop, container.scrollHeight - container.clientHeight));
	}, [activeIndex, currentStep, finalReview]);
	useLayoutEffect(() => {
		if (!finalReview || !expanded) return;
		const container = scrollContainerRef.current;
		const header = reviewHeaderRefs.current[expanded];
		if (!container || !header) return;
		const viewport = container.getBoundingClientRect();
		const row = header.getBoundingClientRect();
		if (row.top < viewport.top) container.scrollTop += row.top - viewport.top;
		else if (row.bottom > viewport.bottom) container.scrollTop += row.bottom - viewport.bottom;
	}, [finalReview, expanded]);
	useEffect(() => {
		if (!popupState.isOpen || currentStep !== 1) return;
		const onArrow = (event: KeyboardEvent) => {
			if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
			const target = event.target as HTMLElement;
			if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
			const id = finalReview ? expanded : activeId;
			const count = id ? matches[id]?.candidates.length : 0;
			if (!id || !count || count < 2) return;
			event.preventDefault();
			setSlideById((previous) => ({
				...previous,
				[id]: ((previous[id] ?? 0) + (event.key === 'ArrowRight' ? 1 : -1) + count) % count,
			}));
		};
		document.addEventListener('keydown', onArrow);
		return () => document.removeEventListener('keydown', onArrow);
	}, [popupState.isOpen, currentStep, finalReview, expanded, activeId, matches]);
	const imageFor = (credential: ExtendedVcEntity, candidate: DcqlSelectedCredential, thumbnail = false) => (
		<CredentialImage
			vcEntity={credential}
			vcEntityInstances={credential.instances}
			filter={credentialImageFilter(credential, candidate)}
			fixedRatio={false}
			imageFit="contain"
			showRibbon={!thumbnail}
			className={thumbnail ? 'w-full max-h-12 rounded-lg' : 'w-full max-h-[min(24rem,45dvh)] rounded-lg'}
		/>
	);
	const panel = (id: string, inReview = false) => {
		const candidates = matches[id]?.candidates ?? [];
		const slide = Math.min(slideById[id] ?? 0, Math.max(0, candidates.length - 1));
		const candidate = candidates[slide];
		const credential = vcEntityList?.find((vc) => vc.batchId === candidate?.batchId);
		if (!candidate || !credential) return null;
		const selected = selection.get(id) ?? [];
		const onlyCandidate = candidates.length === 1;
		const multiple = matches[id].multiple;
		return (
			<div
				className={`rounded-b-xl border border-lm-gray-400 bg-lm-gray-100 dark:border-dm-gray-600 dark:bg-dm-gray-900 ${inReview ? 'border-t-0' : ''}`}
			>
				{!inReview && (
					<div className="flex items-center gap-3 bg-white p-3 dark:bg-dm-gray-800">
						<div className="h-12 w-20 shrink-0">{imageFor(credential, candidate, true)}</div>
						<div className="min-w-0">
							<h3 className="font-semibold">
								<RequestName id={id} matches={matches} inventory={vcEntityList} />
							</h3>
							<span className="mt-1 inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
								{t(multiple ? 'dcqlCredentials.selectOneOrMore' : 'dcqlCredentials.selectOne')}
							</span>
						</div>
					</div>
				)}
				<div className="space-y-3 p-3 sm:p-4">
					{onlyCandidate ? (
						<div className="relative mx-auto w-full max-w-[405px] min-w-0">{imageFor(credential, candidate)}</div>
					) : (
						<Slider
							items={candidates}
							initialSlide={slide + 1}
							onSlideChange={(index) => setSlideById((previous) => ({ ...previous, [id]: index }))}
							className="mx-auto w-full md:max-w-[560px] xm:px-4 px-16 sm:px-24 md:px-8 [&_#previous-slide]:-left-1 [&_#next-slide]:-right-1"
							renderSlideContent={(slideCandidate, index) => {
								const slideCredential = vcEntityList?.find((vc) => vc.batchId === slideCandidate.batchId);
								if (!slideCredential) return null;
								return (
									<div
										role="button"
										tabIndex={index === slide ? 0 : -1}
										aria-pressed={selected.some((item) => item.batchId === slideCandidate.batchId)}
										onClick={(event) => {
											if (!(event.target as HTMLElement).closest('label')) setCredentialChoice(id, slideCandidate);
										}}
										onKeyDown={(event) => {
											if (
												(event.key === 'Enter' || event.key === ' ') &&
												!(event.target as HTMLElement).closest('label')
											) {
												event.preventDefault();
												setCredentialChoice(id, slideCandidate);
											}
										}}
										className="relative w-full cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-primary"
									>
										{imageFor(slideCredential, slideCandidate)}
										<div
											className={`absolute inset-0 rounded-xl transition-opacity bg-lm-gray-300 dark:bg-dm-gray-600 ${
												selected.some((item) => item.batchId === slideCandidate.batchId)
													? 'opacity-0'
													: 'opacity-[0.35]'
											}`}
										/>
										<label
											className="absolute bottom-3 right-3 z-10 flex cursor-pointer rounded-full bg-white/95 p-1.5 shadow-md dark:bg-dm-gray-800"
											title={t('dcqlCredentials.selectCredential')}
											onClick={(event) => event.stopPropagation()}
										>
											<input
												type={multiple ? 'checkbox' : 'radio'}
												name={`credential-${id}`}
												aria-label={t('dcqlCredentials.selectCredentialNumber', { number: index + 1 })}
												checked={selected.some((item) => item.batchId === slideCandidate.batchId)}
												onChange={() => setCredentialChoice(id, slideCandidate)}
												className="h-6 w-6 appearance-none rounded-full border-2 border-primary bg-white checked:bg-primary checked:after:block checked:after:text-center checked:after:text-xs checked:after:leading-5 checked:after:text-white checked:after:content-['✓'] focus-visible:outline-2 focus-visible:outline-primary"
											/>
										</label>
									</div>
								);
							}}
						/>
					)}
					{multiple && !onlyCandidate && (
						<div className="flex justify-center gap-5 text-sm font-semibold text-primary">
							<button
								type="button"
								onClick={() => setAllCredentials(id, true)}
								className="hover:underline focus-visible:outline-2 focus-visible:outline-primary"
							>
								{t('dcqlCredentials.selectAll')}
							</button>
							<button
								type="button"
								onClick={() => setAllCredentials(id, false)}
								className="hover:underline focus-visible:outline-2 focus-visible:outline-primary"
							>
								{t('dcqlCredentials.selectNone')}
							</button>
						</div>
					)}
					<div className="mx-auto max-w-[800px]">
						<DisclosurePreview credential={credential} instance={candidate} />
					</div>
					<div
						className={`mx-auto mt-3 max-w-[800px] text-sm font-bold text-primary dark:text-blue-300 ${inReview ? '' : 'text-right'}`}
					>
						{t('dcqlCredentials.selectedCount', { count: selected.length })}
					</div>
				</div>
			</div>
		);
	};
	if (!popupState.isOpen || !popupState.options) return null;
	const options = popupState.options;

	return (
		<PopupLayout
			isOpen
			onClose={close}
			loading={false}
			fullScreen={screenType !== 'desktop'}
			desktopWidthClassName="w-full max-w-[44rem]"
			desktopMaxHeightClassName={currentStep === 0 ? 'max-h-[min(42rem,90dvh)]' : 'max-h-[min(44rem,88dvh)]'}
			desktopTopAnchored={currentStep === 1}
			padding="p-0"
			fixedHeight
			fitContentHeight={screenType === 'desktop'}
			shouldCloseOnOverlayClick={false}
		>
			<div className={`flex min-h-0 flex-col ${screenType !== 'desktop' ? 'h-full' : 'flex-auto'}`}>
				<div className="shrink-0 px-4 pt-4">
					<div className="flex items-center justify-between gap-4 mb-3">
						<h2 className="text-2xl font-bold text-lm-gray-900 dark:text-dm-gray-100">{t('dcqlCredentials.title')}</h2>
						{showSelectionStep && (
							<span className="text-sm text-lm-gray-600 dark:text-dm-gray-300">
								{t('dcqlCredentials.step', { current: currentStep + 1, total: 2 })}
							</span>
						)}
					</div>
					<hr className="mb-3 border-t border-lm-gray-400 dark:border-dm-gray-600" />
				</div>
				<div ref={scrollContainerRef} className="min-h-0 flex-auto overflow-y-auto overflow-x-hidden px-4 pb-4">
					{currentStep === 0 ? (
						<div className="space-y-4 text-lm-gray-900 dark:text-dm-gray-100">
							<p className="text-sm text-lm-gray-800 dark:text-dm-gray-300">
								<Trans
									i18nKey="dcqlCredentials.combinationsDescription"
									values={{ verifier: prettyDomain(options.verifierDomainName) }}
									components={{ strong: <strong /> }}
								/>
							</p>
							{!hasRequiredSets ? null : combinations.length ? (
								<fieldset className="space-y-2">
									<legend className="sr-only">{t('dcqlCredentials.requiredCombinations')}</legend>
									{combinations.map((combination, index) => (
										<label
											key={JSON.stringify(combination.queryIds)}
											className={`flex w-full items-center gap-4 rounded-lg border p-4 cursor-pointer ${combinationIndex === index ? 'border-2 border-primary bg-primary/5 dark:bg-primary/10' : 'border-lm-gray-400 dark:border-dm-gray-600'}`}
										>
											<input
												type="radio"
												name="required-combination"
												className="h-5 w-5 shrink-0 accent-primary"
												checked={combinationIndex === index}
												onChange={() => chooseCombination(index)}
											/>
											<span className="min-w-0 font-semibold">
												{combination.queryIds.map((id, i) => (
													<span key={id}>
														{i > 0 && ' + '}
														<RequestName id={id} matches={matches} inventory={vcEntityList} />
													</span>
												))}
											</span>
										</label>
									))}
								</fieldset>
							) : (
								<p role="alert">{t('dcqlCredentials.noCombination')}</p>
							)}
							{truncated && (
								<p role="status" className="text-sm text-lm-gray-700 dark:text-dm-gray-300">
									{t('dcqlCredentials.combinationsLimited', { count: MAX_REQUIRED_COMBINATIONS })}
								</p>
							)}
							{emptyResponseAttention && (
								<p role="alert" className="text-sm font-semibold text-lm-red-dark dark:text-red-400">
									{t('dcqlCredentials.emptyResponse')}
								</p>
							)}
							{optionalChoices}
						</div>
					) : (
						<div
							className={
								finalReview
									? `flex flex-col gap-4 text-lm-gray-900 dark:text-dm-gray-100 ${activeIds.length >= 3 ? 'min-h-[28rem]' : activeIds.length === 2 ? 'min-h-[23rem]' : 'min-h-[18rem]'}`
									: 'space-y-4 text-lm-gray-900 dark:text-dm-gray-100'
							}
						>
							<p className="text-sm text-lm-gray-800 dark:text-dm-gray-300">
								<Trans
									i18nKey={
										finalReview ? 'dcqlCredentials.reviewDescription' : 'dcqlCredentials.credentialReviewDescription'
									}
									values={{ verifier: prettyDomain(options.verifierDomainName) }}
									components={{ strong: <strong /> }}
								/>
							</p>
							{options.parsedTransactionData?.map((data, index) => {
								const Component = data.ui;
								return <Component key={index} />;
							})}
							{finalReview ? (
								<div className="space-y-3">
									{activeIds.map((id) => {
										const candidate = selection.get(id)?.[0] ?? matches[id].candidates[0];
										const credential = vcEntityList?.find((vc) => vc.batchId === candidate?.batchId);
										const isExpanded = expanded === id;
										return (
											<section
												key={id}
												className="overflow-hidden rounded-xl border border-lm-gray-400 dark:border-dm-gray-600"
											>
												<button
													type="button"
													ref={(node) => {
														reviewHeaderRefs.current[id] = node;
													}}
													aria-expanded={isExpanded}
													onClick={() => toggleReviewDetails(id)}
													className="flex w-full cursor-pointer items-center gap-3 bg-white p-3 text-left transition-colors hover:bg-[#f3f8ff] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary dark:bg-dm-gray-800 dark:hover:bg-dm-gray-700"
												>
													<div className="h-12 w-20 shrink-0">
														{credential && imageFor(credential, candidate, true)}
													</div>
													<div className="min-w-0 flex-1">
														<h3 className="font-semibold">
															<RequestName id={id} matches={matches} inventory={vcEntityList} />
														</h3>
														<span className="mt-1 inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
															{t(
																matches[id].multiple ? 'dcqlCredentials.selectOneOrMore' : 'dcqlCredentials.selectOne',
															)}
														</span>
													</div>
													<span className="flex shrink-0 flex-col items-end text-sm text-primary">
														<strong>
															{t(isExpanded ? 'dcqlCredentials.hideDetails' : 'dcqlCredentials.showDetails')}
														</strong>
														<small className="text-lm-gray-700 dark:text-dm-gray-300">
															{t('dcqlCredentials.selectedCount', { count: selection.get(id)?.length ?? 0 })}
														</small>
													</span>
													<ChevronDown size={18} aria-hidden="true" className={isExpanded ? 'rotate-180' : ''} />
												</button>
												{isExpanded && panel(id, true)}
											</section>
										);
									})}
								</div>
							) : (
								<div className="space-y-2">
									{activeIds.map((id, index) =>
										index === activeIndex ? (
											<section key={id} ref={activePanelRef}>
												{panel(id)}
											</section>
										) : (
											<div
												key={id}
												className="flex items-center gap-3 rounded-lg border border-lm-gray-400 bg-white p-2 dark:border-dm-gray-600 dark:bg-dm-gray-800"
											>
												<div className="h-12 w-16 shrink-0">
													{(() => {
														const candidate = selection.get(id)?.[0] ?? matches[id].candidates[0];
														const credential = vcEntityList?.find((vc) => vc.batchId === candidate?.batchId);
														return credential && imageFor(credential, candidate, true);
													})()}
												</div>
												<div>
													<h3 className="text-sm font-semibold">
														<RequestName id={id} matches={matches} inventory={vcEntityList} />
													</h3>
													<span className="text-xs text-lm-gray-700 dark:text-dm-gray-300">
														{t('dcqlCredentials.selectedCount', { count: selection.get(id)?.length ?? 0 })}
													</span>
												</div>
											</div>
										),
									)}
								</div>
							)}
							{finalReview && (
								<label
									className={`mt-auto flex items-start gap-2 rounded-lg p-3 text-sm leading-5 ${consentAttention ? 'bg-red-50 dark:bg-red-950/30' : 'bg-white dark:bg-dm-gray-800'}`}
								>
									<input
										ref={consentRef}
										type="checkbox"
										className="mt-0.5 shrink-0 accent-primary"
										aria-label={t('dcqlCredentials.consentAria', {
											verifier: prettyDomain(options.verifierDomainName),
										})}
										aria-invalid={consentAttention}
										aria-describedby={consentAttention ? 'dcql-consent-error' : undefined}
										checked={reviewed}
										onChange={(event) => {
											setReviewed(event.target.checked);
											setConsentAttention(false);
										}}
									/>
									<span>
										<Trans
											i18nKey="dcqlCredentials.consent"
											values={{ verifier: prettyDomain(options.verifierDomainName) }}
											components={{ strong: <strong /> }}
										/>
										{consentAttention && (
											<span
												id="dcql-consent-error"
												role="alert"
												className="mt-1 block text-xs font-semibold text-lm-red-dark dark:text-red-400"
											>
												{t('dcqlCredentials.consentRequired')}
											</span>
										)}
									</span>
								</label>
							)}
						</div>
					)}
				</div>
				<div className="z-10 shrink-0 bg-lm-gray-100 dark:bg-dm-gray-900 border-t border-lm-gray-400 dark:border-dm-gray-600 shadow-2xl flex justify-between px-4 py-3">
					<Button id="cancel-select-credentials" onClick={close}>
						{t('dcqlCredentials.cancelPresentation')}
					</Button>
					<div className="flex gap-2">
						{currentStep === 1 && showSelectionStep && (
							<Button
								id="previous-select-credentials"
								variant="outline"
								onClick={() => {
									if (finalReview) {
										alignActivePanelRef.current = true;
										setStage('credentials');
										setActiveIndex(activeIds.length - 1);
									} else if (activeIndex > 0) {
										alignActivePanelRef.current = true;
										setActiveIndex(activeIndex - 1);
									} else setStage('combinations');
									setReviewed(false);
								}}
							>
								{t('common.previous')}
							</Button>
						)}
						<Button
							id={currentStep === 0 || !finalReview ? 'next-select-credentials' : 'send-select-credentials'}
							variant="primary"
							disabled={
								currentStep === 0 ? !combinationValid : !finalReview && (!activeId || !selection.get(activeId)?.length)
							}
							onClick={() => {
								if (currentStep === 0) {
									if (!combinationValid) return;
									if (!selection.size) {
										setEmptyResponseAttention(true);
										return;
									}
									startCredentialReview();
									return;
								}
								if (!finalReview) {
									if (!activeId || !selection.get(activeId)?.length) return;
									if (activeIndex < activeIds.length - 1) {
										alignActivePanelRef.current = true;
										setActiveIndex(activeIndex + 1);
									} else {
										setStage('review');
										setExpanded(null);
									}
									return;
								}
								if (!reviewed) {
									setConsentAttention(true);
									consentRef.current?.scrollIntoView?.({ block: 'nearest' });
									consentRef.current?.focus();
									return;
								}
								if (!valid) {
									const missingId = activeIds.find((id) => !selection.get(id)?.length);
									if (missingId) {
										setExpanded(missingId);
										reviewHeaderRefs.current[missingId]?.focus();
									}
									return;
								}
								popupState.resolve(selection);
								setPopupState((current) => ({ ...current, isOpen: false }));
							}}
						>
							{currentStep === 0
								? t('dcqlCredentials.reviewDetails')
								: finalReview
									? t('common.navItemSendCredentialsSimple')
									: t('common.next')}
						</Button>
					</div>
				</div>
			</div>
		</PopupLayout>
	);
}
