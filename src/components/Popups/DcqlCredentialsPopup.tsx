import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as walletCommonModule from 'wallet-common';
import type { ClaimPath, CredentialClaimPath, DcqlMatches, DcqlSelection, DcqlSelectedCredential } from 'wallet-common';
import { ChevronDown, Trash2 } from 'lucide-react';
import PopupLayout from './PopupLayout';
import CredentialImage from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';
import Button from '../Buttons/Button';
import useScreenType from '@/hooks/useScreenType';
import { useCredentialName } from '@/hooks/useCredentialName';
import i18n from '@/i18n';
import { prettyDomain } from '@/utils';
import type { ExtendedVcEntity } from '@/context/CredentialsContext';
import type { CredentialSelectionPopupState, SetCredentialSelectionPopupState } from '@/types/credentialSelection';

interface Props {
	popupState: CredentialSelectionPopupState;
	setPopupState: SetCredentialSelectionPopupState;
	vcEntityList: ExtendedVcEntity[] | null;
}

const preferredLanguages = ['en-US'];
const walletCommon =
	(walletCommonModule as typeof walletCommonModule & { default?: typeof walletCommonModule }).default ??
	walletCommonModule;
const { dcqlSelectionIsValid, reconcileDcqlSelection } = walletCommon;

interface RequiredCombination {
	choices: (number | null)[];
	queryIds: string[];
}

const MAX_REQUIRED_COMBINATIONS = 256;

export function completeRequiredCombinations(
	requirements: DcqlMatches[string]['requirements'],
	matches: DcqlMatches,
): { combinations: RequiredCombination[]; truncated: boolean } {
	const required = requirements.map((set, index) => ({ set, index })).filter(({ set }) => set.required !== false);
	let combinations: RequiredCombination[] = [{ choices: requirements.map(() => null), queryIds: [] }];
	let truncated = false;
	for (const { set, index } of required) {
		const next: RequiredCombination[] = [];
		const seen = new Set<string>();
		collect: for (const combination of combinations) {
			for (const option of set.options) {
				if (!option.available || !option.queryIds.every((id) => matches[id]?.candidates.length)) continue;
				const queryIds = [...new Set([...combination.queryIds, ...option.queryIds])];
				const key = JSON.stringify([...queryIds].sort());
				if (seen.has(key)) continue;
				if (next.length === MAX_REQUIRED_COMBINATIONS) {
					truncated = true;
					break collect;
				}
				seen.add(key);
				next.push({
					choices: combination.choices.map((choice, i) => (i === index ? option.optionIndex : choice)),
					queryIds,
				});
			}
		}
		combinations = next;
	}
	return { combinations, truncated };
}

function CredentialIssueDate({ credential }: { credential: ExtendedVcEntity }) {
	const { t } = useTranslation();
	const signed = credential.parsedCredential.validityInfo.signed;
	const formatted =
		signed instanceof Date && !Number.isNaN(signed.getTime())
			? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })
					.format(signed)
					.replace(/(\d{1,2}), (?=\d{4},)/, '$1 ')
			: null;
	return formatted ? (
		<span className="text-xs text-lm-gray-700 dark:text-dm-gray-300">
			{t('dcqlCredentials.issuedOn', { date: formatted })}
		</span>
	) : null;
}

function CredentialName({ credential }: { credential: ExtendedVcEntity }) {
	const { i18n: translator } = useTranslation();
	const languages = useMemo(() => [translator.language, ...preferredLanguages], [translator.language]);
	const name = useCredentialName(
		credential.parsedCredential?.metadata?.credential?.name,
		credential.batchId,
		languages,
	);
	return <>{name}</>;
}

function WalletCredentialCount({ credential, count }: { credential: ExtendedVcEntity; count: number }) {
	const { t, i18n: translator } = useTranslation();
	const languages = useMemo(() => [translator.language, ...preferredLanguages], [translator.language]);
	const name = useCredentialName(
		credential.parsedCredential?.metadata?.credential?.name,
		credential.batchId,
		languages,
	);
	return <>{t('dcqlCredentials.walletCredentialCount', { count, name })}</>;
}

function CredentialOptionText({ credential }: { credential: ExtendedVcEntity }) {
	return (
		<span className="flex min-w-0 flex-col gap-0.5">
			<span className="font-semibold">
				<CredentialName credential={credential} />
			</span>
			<CredentialIssueDate credential={credential} />
		</span>
	);
}

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

function disclosedDisplay(credential: ExtendedVcEntity, instance: DcqlSelectedCredential) {
	const toJson = (value: unknown): unknown =>
		value instanceof Date || value instanceof Uint8Array
			? value
			: value instanceof Map
				? Object.fromEntries([...value].map(([k, v]) => [k, toJson(v)]))
				: Array.isArray(value)
					? value.map(toJson)
					: value && typeof value === 'object'
						? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toJson(v)]))
						: value;
	const allClaims = toJson(instance.disclosedClaims) as Record<string, unknown>;
	const disclosedPaths: ClaimPath[] = [];
	const visit = (value: unknown, path: ClaimPath) => {
		if (
			value &&
			typeof value === 'object' &&
			!(value instanceof Date) &&
			!(value instanceof Uint8Array) &&
			Object.keys(value).length
		)
			Object.entries(value).forEach(([key, child]) =>
				visit(child, [...path, Array.isArray(value) ? Number(key) : key]),
			);
		else disclosedPaths.push(path);
	};
	visit(allClaims, []);
	const protocolFields = new Set(['cnf', 'iat', 'nbf', 'exp', 'iss', 'vct', 'vct#integrity', 'trust_anchor', 'status']);
	const displayPaths = disclosedPaths.filter(
		(path) =>
			credential.parsedCredential.metadata.credential.format === 'mso_mdoc' || !protocolFields.has(String(path[0])),
	);
	return { allClaims, displayPaths };
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
					requested={{ display: 'hide' }}
					visibleFields={displayPaths}
					noInnerScroll
					mainClassName="text-xs w-full"
				/>
			</div>
		</div>
	);
}

function credentialImageFilter(credential: ExtendedVcEntity, instance: DcqlSelectedCredential): CredentialClaimPath[] {
	const requiredPaths = (credential.parsedCredential.metadata.credential.TypeMetadata?.claims ?? [])
		.filter((claim) => claim.required === true)
		.map((claim) => claim.path);
	return Array.from(
		new Map(
			[...instance.disclosurePaths, ...requiredPaths].map((path) => {
				const imagePath = path.map((segment) => (segment === null ? '' : String(segment)));
				return [JSON.stringify(imagePath), imagePath] as const;
			}),
		).values(),
	);
}

export default function DcqlCredentialsPopup({ popupState, setPopupState, vcEntityList }: Props) {
	const { t } = useTranslation();
	const screenType = useScreenType();
	const matches = useMemo(() => {
		const raw = popupState.options?.conformantCredentialsMap ?? {};
		const source = Object.values(raw)[0]?.requirements;
		const normalized = source?.length
			? source.map((set) => ({ ...set, required: set.required !== false }))
			: Object.keys(raw).map((id, setIndex) => ({
					setIndex,
					required: true,
					options: [{ optionIndex: 0, queryIds: [id], available: !!raw[id].candidates.length }],
				}));
		return Object.fromEntries(
			Object.entries(raw).map(([id, match]) => [id, { ...match, requirements: normalized }]),
		) as DcqlMatches;
	}, [popupState.options]);
	const requirements = useMemo(() => Object.values(matches)[0]?.requirements ?? [], [matches]);
	const { combinations, truncated } = useMemo(
		() => completeRequiredCombinations(requirements, matches),
		[requirements, matches],
	);
	const hasRequiredSets = requirements.some((set) => set.required !== false);
	const [choices, setChoices] = useState<(number | null)[]>([]);
	const [combinationIndex, setCombinationIndex] = useState(0);
	const [selection, setSelection] = useState<DcqlSelection>(new Map());
	const [step, setStep] = useState(0);
	const [changing, setChanging] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<string | null>(null);
	const changingMenuRef = useRef<HTMLDivElement>(null);
	const [reviewed, setReviewed] = useState(false);
	useEffect(() => {
		if (!changing) return;
		const closeOnOutsideClick = (event: PointerEvent) => {
			if (!changingMenuRef.current?.contains(event.target as Node)) setChanging(null);
		};
		document.addEventListener('pointerdown', closeOnOutsideClick);
		return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
	}, [changing]);

	// The credential context lists newest issuances first. Match that order when
	// choosing a default, while preserving the matcher’s preferred claim set.
	const preferred = (id: string): DcqlSelectedCredential[] => {
		const candidates = matches[id]?.candidates ?? [];
		const firstInInventory = vcEntityList?.find((vc) =>
			candidates.some((candidate) => candidate.batchId === vc.batchId),
		);
		const candidate = candidates.find((item) => item.batchId === firstInInventory?.batchId) ?? candidates[0];
		return candidate ? [candidate] : [];
	};
	const reconcile = (nextChoices: (number | null)[], previous: DcqlSelection): DcqlSelection => {
		const active = reconcileDcqlSelection(matches, nextChoices, previous);
		return new Map([...active].map(([id, instances]) => [id, previous.has(id) ? instances : preferred(id)]));
	};
	useEffect(() => {
		if (!popupState.isOpen || !popupState.options) return;
		const defaults = combinations[0]?.choices ?? requirements.map(() => null);
		setChoices(defaults);
		setCombinationIndex(0);
		setSelection(reconcile(defaults, new Map()));
		setStep(0);
		setChanging(null);
		setExpanded(null);
		setReviewed(false);
		// A newly opened request has new matches; inventory changes while open should
		// not discard a user's choices.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [popupState.options, popupState.isOpen, requirements, combinations]);

	const valid =
		combinations.length > 0 &&
		dcqlSelectionIsValid(matches, choices, selection) &&
		[...selection.values()].flat().every((instance) => vcEntityList?.some((vc) => vc.batchId === instance.batchId));
	const hasOptionalChoices = requirements.some(
		(set) => set.required === false && set.options.some((option) => option.available),
	);
	const showSelectionStep = combinations.length !== 1 || hasOptionalChoices;
	const currentStep = showSelectionStep ? step : 1;
	const chooseCombination = (index: number) => {
		const next = combinations[index].choices.map((choice, i) =>
			requirements[i].required === false ? choices[i] : choice,
		);
		setCombinationIndex(index);
		setChoices(next);
		setSelection((previous) => reconcile(next, previous));
		setReviewed(false);
	};
	const chooseOption = (index: number, optionIndex: number | null) => {
		const next = choices.map((choice, i) => (i === index ? optionIndex : choice));
		setChoices(next);
		setSelection((previous) => reconcile(next, previous));
		setChanging(null);
		setReviewed(false);
	};
	const changeCredential = (
		id: string,
		batchId: number,
		action: 'switch' | 'add' | 'remove',
		candidate?: DcqlSelectedCredential,
	) => {
		setSelection((previous) => {
			const next = new Map(previous);
			const current = previous.get(id) ?? [];
			if (action === 'remove')
				next.set(
					id,
					current.filter((item) => item.batchId !== batchId),
				);
			else if (candidate)
				next.set(
					id,
					action === 'add'
						? [...current, candidate]
						: current.map((item) => (item.batchId === batchId ? candidate : item)),
				);
			return next;
		});
		setChanging(null);
		setReviewed(false);
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
	if (!popupState.isOpen || !popupState.options) return null;
	const options = popupState.options;

	return (
		<PopupLayout
			isOpen
			onClose={close}
			loading={false}
			fullScreen={screenType !== 'desktop'}
			desktopWidthClassName="w-full max-w-[44rem]"
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
				<div className="min-h-0 flex-auto overflow-y-auto overflow-x-hidden px-4 pb-4">
					{currentStep === 0 ? (
						<div className="space-y-4 text-lm-gray-900 dark:text-dm-gray-100">
							<div>
								<h3 className="text-xl font-semibold">{t('dcqlCredentials.chooseWhatToShare')}</h3>
								{hasRequiredSets && combinations.length > 1 && (
									<p className="text-sm text-lm-gray-700 dark:text-dm-gray-300">
										{t('dcqlCredentials.combinationsDescription')}
									</p>
								)}
							</div>
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
							<p className="text-sm text-lm-gray-600 dark:text-dm-gray-300">{t('dcqlCredentials.reviewNext')}</p>
							{optionalChoices}
						</div>
					) : (
						<div className="space-y-4 text-lm-gray-900 dark:text-dm-gray-100">
							<p className="text-sm text-lm-gray-700 dark:text-dm-gray-300">
								{t('dcqlCredentials.reviewDescription', { verifier: prettyDomain(options.verifierDomainName) })}
							</p>
							{options.parsedTransactionData?.map((data, index) => {
								const Component = data.ui;
								return <Component key={index} />;
							})}
							<div className="space-y-4">
								{[...selection].map(([id, instances]) => (
									<section key={id} className="space-y-3">
										{instances.map((instance) => {
											const credential = vcEntityList?.find((vc) => vc.batchId === instance.batchId);
											if (!credential) return null;
											const menuKey = `${id}-${instance.batchId}`;
											const isExpanded = expanded === menuKey;
											const credentialCount = new Set(matches[id].candidates.map((candidate) => candidate.batchId))
												.size;
											const alternatives = (vcEntityList ?? []).flatMap((vc) => {
												const candidate = matches[id].candidates.find((item) => item.batchId === vc.batchId);
												return candidate && !instances.some((item) => item.batchId === vc.batchId)
													? [{ credential: vc, candidate }]
													: [];
											});
											const canRemove = matches[id].multiple && instances.length > 1;
											return (
												<div
													key={instance.batchId}
													className="min-w-0 rounded-xl border border-lm-gray-400 dark:border-dm-gray-600 p-4"
												>
													<div className="flex items-start justify-between gap-3">
														<div className="flex min-w-0 flex-1 items-center gap-4">
															<div className="w-24 shrink-0 sm:w-32">
																<CredentialImage
																	vcEntity={credential}
																	vcEntityInstances={credential.instances}
																	className="w-full rounded-lg"
																	filter={credentialImageFilter(credential, instance)}
																/>
															</div>
															<div className="min-w-0">
																<h3 className="font-semibold">
																	<CredentialName credential={credential} />
																</h3>
															</div>
														</div>
														{canRemove && (
															<button
																type="button"
																aria-label={t('dcqlCredentials.removeCredential')}
																className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-lm-red-dark transition-colors hover:bg-lm-gray-200 focus-visible:outline-2 focus-visible:outline-primary dark:text-red-400 dark:hover:bg-dm-gray-800"
																onClick={() => changeCredential(id, instance.batchId, 'remove')}
															>
																<Trash2 size={16} aria-hidden="true" />
																{t('dcqlCredentials.remove')}
															</button>
														)}
													</div>
													{alternatives.length > 0 && (
														<div ref={changing === menuKey ? changingMenuRef : undefined} className="relative mt-3">
															<p className="mb-2 text-sm text-lm-gray-700 dark:text-dm-gray-300">
																<WalletCredentialCount credential={credential} count={credentialCount} />
															</p>
															<button
																type="button"
																className="inline-flex items-center gap-2 rounded text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
																aria-expanded={changing === menuKey}
																onClick={() => setChanging(changing === menuKey ? null : menuKey)}
															>
																{t('dcqlCredentials.chooseAnother')}
																<ChevronDown
																	size={16}
																	aria-hidden="true"
																	className={changing === menuKey ? 'rotate-180' : ''}
																/>
															</button>
															{changing === menuKey && (
																<div className="absolute left-0 top-full z-20 mt-2 max-h-[min(18rem,40dvh)] w-full space-y-1 overflow-y-auto rounded-lg border border-lm-gray-400 bg-lm-gray-100 p-2 shadow-xl dark:border-dm-gray-600 dark:bg-dm-gray-900">
																	{alternatives.map(({ credential: alternative, candidate }) =>
																		matches[id].multiple ? (
																			<div
																				key={alternative.batchId}
																				className="rounded-lg px-2 py-2 hover:bg-lm-gray-200 dark:hover:bg-dm-gray-800"
																			>
																				<p className="font-medium text-sm">
																					<CredentialOptionText credential={alternative} />
																				</p>
																				<div className="flex gap-2 mt-1">
																					<Button
																						variant="outline"
																						size="sm"
																						onClick={() => changeCredential(id, instance.batchId, 'switch', candidate)}
																					>
																						{t('dcqlCredentials.change')}
																					</Button>
																					<Button
																						variant="outline"
																						size="sm"
																						onClick={() => changeCredential(id, instance.batchId, 'add', candidate)}
																					>
																						{t('dcqlCredentials.add')}
																					</Button>
																				</div>
																			</div>
																		) : (
																			<button
																				key={alternative.batchId}
																				type="button"
																				className="block w-full rounded-lg px-2 py-2 text-left cursor-pointer hover:bg-lm-gray-200 dark:hover:bg-dm-gray-800 focus-visible:outline-2 focus-visible:outline-primary"
																				onClick={() => changeCredential(id, instance.batchId, 'switch', candidate)}
																			>
																				<span className="block font-medium text-sm">
																					<CredentialOptionText credential={alternative} />
																				</span>
																			</button>
																		),
																	)}
																</div>
															)}
														</div>
													)}
													<div className="mt-4 border-t border-lm-gray-400 pt-4 dark:border-dm-gray-600">
														<button
															type="button"
															className="flex w-full items-center justify-between gap-2 text-left font-semibold text-primary"
															aria-expanded={isExpanded}
															onClick={() => setExpanded(isExpanded ? null : menuKey)}
														>
															<span>{t('dcqlCredentials.informationYoullShare')}</span>
															<ChevronDown size={20} aria-hidden="true" className={isExpanded ? 'rotate-180' : ''} />
														</button>
														{isExpanded && (
															<div className="mt-3">
																<DisclosurePreview credential={credential} instance={instance} />
															</div>
														)}
													</div>
												</div>
											);
										})}
									</section>
								))}
							</div>
							<label className="flex items-start gap-2 text-sm leading-5">
								<input
									type="checkbox"
									className="mt-0.5 shrink-0 accent-primary"
									checked={reviewed}
									onChange={(event) => setReviewed(event.target.checked)}
								/>
								<span>{t('dcqlCredentials.consent', { verifier: prettyDomain(options.verifierDomainName) })}</span>
							</label>
						</div>
					)}
				</div>
				<div className="z-10 shrink-0 bg-lm-gray-100 dark:bg-dm-gray-900 border-t border-lm-gray-400 dark:border-dm-gray-600 shadow-2xl flex justify-between px-4 py-3">
					<Button id="cancel-select-credentials" onClick={close}>
						{t('common.cancel')}
					</Button>
					<div className="flex gap-2">
						{currentStep === 1 && showSelectionStep && (
							<Button
								id="previous-select-credentials"
								variant="outline"
								onClick={() => {
									setStep(0);
									setReviewed(false);
								}}
							>
								{t('common.previous')}
							</Button>
						)}
						<Button
							id={currentStep === 0 ? 'next-select-credentials' : 'send-select-credentials'}
							variant="primary"
							disabled={!valid || (currentStep === 1 && !reviewed)}
							onClick={() => {
								if (!valid) return;
								if (currentStep === 0) {
									setStep(1);
									return;
								}
								if (!reviewed) return;
								popupState.resolve(selection);
								setPopupState((current) => ({ ...current, isOpen: false }));
							}}
						>
							{currentStep === 0 ? t('dcqlCredentials.reviewDetails') : t('common.navItemSendCredentialsSimple')}
						</Button>
					</div>
				</div>
			</div>
		</PopupLayout>
	);
}
