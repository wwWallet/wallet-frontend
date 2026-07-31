import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { Check, CircleAlert, CircleCheckBig, LoaderCircle, LockKeyhole, X } from 'lucide-react';
import { getLanguage } from '@/i18n';
import { truncateByWords } from '@/utils';
import PopupLayout from './PopupLayout';
import Button from '../Buttons/Button';

const steps = ['scan', 'connect', 'review', 'share'];

export const PROXIMITY_SHARING_STATUS = Object.freeze({
	SCAN: 'scan',
	PAIRING: 'pairing',
	WAITING_FOR_REQUEST: 'waitingForRequest',
	REVIEW: 'review',
	SHARING: 'sharing',
	SUCCESS: 'success',
	CONNECTION_FAILED: 'connectionFailed',
	CREDENTIAL_MISMATCH: 'credentialMismatch',
	SHARING_FAILED: 'sharingFailed',
});

const currentStepForStatus = (status) => {
	if ([PROXIMITY_SHARING_STATUS.PAIRING, PROXIMITY_SHARING_STATUS.WAITING_FOR_REQUEST, PROXIMITY_SHARING_STATUS.CONNECTION_FAILED].includes(status)) return 1;
	if ([PROXIMITY_SHARING_STATUS.REVIEW, PROXIMITY_SHARING_STATUS.CREDENTIAL_MISMATCH].includes(status)) return 2;
	if ([PROXIMITY_SHARING_STATUS.SHARING, PROXIMITY_SHARING_STATUS.SUCCESS, PROXIMITY_SHARING_STATUS.SHARING_FAILED].includes(status)) return 3;
	return 0;
};

const humanizeFieldName = (name) => name
	.split('_')
	.map(word => word ? `${word[0].toUpperCase()}${word.slice(1)}` : '')
	.join(' ');

const getValueAtPath = (source, path) => path.reduce((value, segment) => {
	if (value instanceof Map) return value.get(segment);
	return value?.[segment];
}, source);

const findValueByKey = (source, targetKey, visited = new WeakSet()) => {
	if (!source || typeof source !== 'object') return undefined;
	if (visited.has(source)) return undefined;
	visited.add(source);

	const entries = source instanceof Map ? Array.from(source.entries()) : Object.entries(source);
	const directMatch = entries.find(([key]) => key === targetKey);
	if (directMatch) return directMatch[1];

	for (const [, value] of entries) {
		const match = findValueByKey(value, targetKey, visited);
		if (match !== undefined) return match;
	}
	return undefined;
};

const imageSourceForValue = (value) => {
	if (typeof value === 'string' && value.toLowerCase().startsWith('data:image/')) return value;

	const bytes = value instanceof Uint8Array
		? value
		: value && typeof value === 'object' && Object.keys(value).length > 0 && Object.values(value).every(item => typeof item === 'number')
			? new Uint8Array(Object.values(value))
			: null;
	if (!bytes) return null;

	let binary = '';
	for (let index = 0; index < bytes.length; index += 8192) {
		binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
	}
	return `data:image/jpeg;base64,${btoa(binary)}`;
};

const displayValue = (value) => {
	if (value === undefined || value === null || value === '') return '—';
	if (typeof value === 'boolean') return String(value);
	if (value instanceof Map) return JSON.stringify(Object.fromEntries(value));
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
};

const StepBar = ({ currentStep, complete }) => {
	const { t } = useTranslation();
	return (
		<ol className="flex w-full items-start" aria-label={t('qrShareMdoc.progressLabel')}>
			{steps.map((step, index) => {
				const done = complete || index < currentStep;
				const current = !complete && index === currentStep;
				return <React.Fragment key={step}>
					<li className="flex min-w-0 flex-col items-center gap-1.5" aria-current={current ? 'step' : undefined}>
						<span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${done ? 'border-primary bg-primary text-white' : current ? 'border-primary text-primary dark:text-white' : 'border-lm-gray-400 text-lm-gray-600 dark:border-dm-gray-600 dark:text-dm-gray-300'}`}>
							{done ? <Check size={16} strokeWidth={3} /> : index + 1}
						</span>
						<span className={`text-center text-xs ${done || current ? 'font-semibold text-lm-gray-900 dark:text-dm-gray-100' : 'text-lm-gray-600 dark:text-dm-gray-300'}`}>
							{t(`qrShareMdoc.steps.${step}`)}
						</span>
					</li>
					{index < steps.length - 1 && <div className={`mt-3.5 h-px min-w-3 flex-1 ${done ? 'bg-primary' : 'bg-lm-gray-400 dark:bg-dm-gray-600'}`} aria-hidden="true" />}
				</React.Fragment>;
			})}
		</ol>
	);
};

const ErrorState = ({ title, description }) => <div className="flex h-full flex-col items-center justify-center text-center">
	<CircleAlert className="text-lm-red dark:text-dm-red" size={64} strokeWidth={1.5} aria-hidden="true" />
	<h3 className="mt-4 text-lg font-bold text-lm-gray-900 dark:text-dm-gray-100">{title}</h3>
	<p className="mt-2 max-w-sm text-sm text-lm-gray-800 dark:text-dm-gray-200">{description}</p>
</div>;

const TransferProgress = ({ failed, itemCount, t }) => <div className="flex h-full flex-col items-center justify-center text-center">
	<h3 className="text-lg font-bold text-lm-gray-900 dark:text-dm-gray-100">
		{failed ? t('qrShareMdoc.sharingFailedHeading') : t('qrShareMdoc.sharingHeading')}
	</h3>
	<p className="mt-1 text-sm text-lm-gray-800 dark:text-dm-gray-200">{failed ? t('qrShareMdoc.connectionLost') : t('qrShareMdoc.keepOpen')}</p>
	{failed
		? <CircleAlert className="mt-7 h-20 w-20 text-lm-red dark:text-dm-red" strokeWidth={1.5} aria-hidden="true" />
		: <LoaderCircle className="mt-7 h-20 w-20 animate-spin text-primary dark:text-brand-light" strokeWidth={1.5} aria-hidden="true" />}
	<p className={`mt-5 text-sm font-semibold ${failed ? 'text-lm-red dark:text-dm-red' : 'text-lm-gray-900 dark:text-dm-gray-100'}`}>
		{failed ? t('qrShareMdoc.sendingFailed') : t('qrShareMdoc.sendingItems', { count: itemCount })}
	</p>
</div>;

const ProximitySharingPopup = ({ isOpen, fullScreen, status, qrContent, credential, requestedFields, bluetoothPairingCancelled, requiresUserGesture, onConnect, onConsent, onCancel, onClose }) => {
	const { t, i18n } = useTranslation();
	const [showAllNotShared, setShowAllNotShared] = useState(false);
	const claims = credential?.parsedCredential?.metadata?.credential?.TypeMetadata?.claims ?? [];
	const signedClaims = credential?.parsedCredential?.signedClaims;
	const requestedFieldSet = new Set(requestedFields);
	const claimForField = (field) => claims.find(claim => Array.isArray(claim.path) && claim.path.at(-1) === field);
	const labelForClaim = (claim, fallback) => {
		const displays = claim?.display ?? [];
		const activeLanguage = getLanguage(i18n.language);
		const fallbackLanguage = getLanguage(i18n.options.fallbackLng);
		const activeLanguageLabel = displays.find(display => getLanguage(display.locale) === activeLanguage)?.label;
		const fallbackLanguageLabel = displays.find(display => getLanguage(display.locale) === fallbackLanguage)?.label;

		return activeLanguageLabel
			?? fallbackLanguageLabel
			?? displays[0]?.label
			?? humanizeFieldName(fallback);
	};
	const valueForField = (field, claim) => {
		const pathValue = Array.isArray(claim?.path) ? getValueAtPath(signedClaims, claim.path) : undefined;
		return pathValue ?? findValueByKey(signedClaims, field);
	};
	const requestedItems = requestedFields.map(field => {
		const claim = claimForField(field);
		const value = valueForField(field, claim);
		return { field, label: labelForClaim(claim, field), value, imageSource: field.toLowerCase().includes('portrait') ? imageSourceForValue(value) : null };
	});
	const notSharedLabels = claims
		.filter(claim => Array.isArray(claim.path) && !requestedFieldSet.has(claim.path.at(-1)) && valueForField(claim.path.at(-1), claim) !== undefined)
		.map(claim => labelForClaim(claim, claim.path.at(-1)).toLowerCase())
		.filter((label, index, labels) => labels.indexOf(label) === index);
	const notSharedSummary = notSharedLabels.length > 0 ? notSharedLabels.join(', ') : t('qrShareMdoc.nothingElse');
	const { text: truncatedNotShared, truncated: hasHiddenNotShared } = truncateByWords(notSharedSummary, 60);
	const visibleNotSharedSummary = showAllNotShared ? notSharedSummary : truncatedNotShared;
	return (
		<PopupLayout isOpen={isOpen} onClose={onClose} fullScreen={fullScreen} flushFullScreen padding="p-0" shouldCloseOnOverlayClick={false}>
			<div className={`flex flex-col ${fullScreen ? 'h-full' : 'h-[min(640px,calc(90dvh-2rem))]'}`}>
				<header className="shrink-0 px-5 pt-5 sm:px-6 sm:pt-6">
					<div className="flex items-center justify-between gap-4">
						<h2 className="text-lg font-bold text-primary dark:text-white">{t('qrShareMdoc.presentCredential')}</h2>
						{status === PROXIMITY_SHARING_STATUS.SCAN && <button
							id="close-proximity-sharing-popup"
							type="button"
							className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-transparent text-lm-gray-900 transition-colors hover:bg-lm-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-dm-gray-100 dark:hover:bg-dm-gray-600"
							onClick={onClose}
							aria-label={t('messagePopup.close')}
						>
							<X size={18} aria-hidden="true" />
						</button>}
					</div>
					<div className="mt-4 border-y border-lm-gray-400 py-3 dark:border-dm-gray-600">
						<StepBar currentStep={currentStepForStatus(status)} complete={status === PROXIMITY_SHARING_STATUS.SUCCESS} />
					</div>
				</header>
				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 custom-scrollbar sm:px-6">
					{status === PROXIMITY_SHARING_STATUS.SCAN && (
						<div className="flex h-full flex-col items-center text-center">
							<h3 className="text-lg font-bold text-lm-gray-900 dark:text-dm-gray-100">
								{t('qrShareMdoc.scanHeading')}
							</h3>
							<div className="mt-5 rounded-lg bg-white p-4">
								<QRCode
									value={qrContent}
									size={200}
									style={{ height: 'auto', maxWidth: '100%', width: '200px' }}
								/>
							</div>
							<p className="mt-5 max-w-sm text-sm text-lm-gray-800 dark:text-dm-gray-200">
								{t('qrShareMdoc.scanInstructions')}
							</p>
							{bluetoothPairingCancelled && (
								<p className="mt-2 max-w-sm text-sm text-lm-gray-800 dark:text-dm-gray-200">
									{t('qrShareMdoc.pairingCancelled')}
								</p>
							)}
						</div>
					)}

					{status === PROXIMITY_SHARING_STATUS.CONNECTION_FAILED && (
						<ErrorState
							title={t('qrShareMdoc.connectionFailedHeading')}
							description={t('qrShareMdoc.connectionFailed')}
						/>
					)}

					{status === PROXIMITY_SHARING_STATUS.PAIRING && (
						<div className="flex h-full flex-col items-center justify-center text-center">
							<LoaderCircle
								className="h-16 w-16 animate-spin text-primary dark:text-brand-light"
								strokeWidth={1.5}
								aria-hidden="true"
							/>
							<h3 className="mt-5 text-lg font-bold text-lm-gray-900 dark:text-dm-gray-100">
								{t('qrShareMdoc.connectingHeading')}
							</h3>
							<p className="mt-2 max-w-sm text-sm text-lm-gray-800 dark:text-dm-gray-200">
								{t('qrShareMdoc.connectingInstructions')}
							</p>
						</div>
					)}

					{status === PROXIMITY_SHARING_STATUS.WAITING_FOR_REQUEST && (
						<div className="flex h-full flex-col items-center justify-center text-center">
							<LoaderCircle
								className="h-16 w-16 animate-spin text-primary dark:text-brand-light"
								strokeWidth={1.5}
								aria-hidden="true"
							/>
							<h3 className="mt-5 text-lg font-bold text-lm-gray-900 dark:text-dm-gray-100">
								{t('qrShareMdoc.connected')}
							</h3>
							<p className="mt-2 max-w-sm text-sm text-lm-gray-800 dark:text-dm-gray-200">
								{t('qrShareMdoc.waitingForRequest')}
							</p>
						</div>
					)}

					{status === PROXIMITY_SHARING_STATUS.REVIEW && (
						<div className="mx-auto w-full max-w-md">
							<h3 className="text-center text-lg font-bold text-lm-gray-900 dark:text-dm-gray-100">
								{t('qrShareMdoc.reviewHeading')}
							</h3>
							<p className="mt-1 text-center text-sm text-lm-gray-800 dark:text-dm-gray-200">
								{t('qrShareMdoc.reviewDescription')}
							</p>
							<ul className="mt-4 overflow-hidden rounded-lg border border-lm-gray-400 bg-lm-gray-50 dark:border-dm-gray-600 dark:bg-dm-gray-800">
								{requestedItems.map(item => (
									<li
										key={item.field}
										className="flex min-h-16 items-center gap-3 border-b border-lm-gray-400 px-3 py-1.5 last:border-b-0 dark:border-dm-gray-600"
									>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold text-lm-gray-900 dark:text-dm-gray-100">
												{item.label}
											</p>
											{item.imageSource ? (
												<img
													src={item.imageSource}
													alt=""
													className="mt-1 h-11 w-11 rounded-md border border-lm-gray-400 bg-white object-contain dark:border-dm-gray-600"
												/>
											) : (
												<p
													className="mt-1 truncate text-xs text-lm-gray-700 dark:text-dm-gray-300"
													title={displayValue(item.value)}
												>
													{displayValue(item.value)}
												</p>
											)}
										</div>
										<Check
											size={18}
											strokeWidth={2.5}
											className="shrink-0 text-lm-green dark:text-dm-green"
											aria-hidden="true"
										/>
									</li>
								))}
							</ul>
							<div className="mt-4 flex items-start gap-2 text-xs text-lm-gray-700 dark:text-dm-gray-300">
								<LockKeyhole
									size={16}
									className="mt-0.5 shrink-0 text-primary dark:text-brand-light"
									aria-hidden="true"
								/>
								<p>
									{t('qrShareMdoc.notShared', { fields: visibleNotSharedSummary })}
									{(!hasHiddenNotShared || showAllNotShared) && '.'}
									{hasHiddenNotShared && (
										<>
											{' '}
											<button
												type="button"
												className="font-medium text-primary hover:underline dark:text-brand-light"
												onClick={() => setShowAllNotShared(current => !current)}
											>
												{showAllNotShared ? t('common.showLess') : t('common.showMore')}
											</button>
										</>
									)}
								</p>
							</div>
						</div>
					)}

					{status === PROXIMITY_SHARING_STATUS.SHARING && (
						<TransferProgress itemCount={requestedItems.length} t={t} />
					)}

					{status === PROXIMITY_SHARING_STATUS.SUCCESS && (
						<div className="flex h-full flex-col items-center justify-center text-center">
							<CircleCheckBig
								className="text-lm-green dark:text-dm-green"
								size={80}
								strokeWidth={1.5}
								aria-hidden="true"
							/>
							<h3 className="mt-4 text-xl font-bold text-lm-gray-900 dark:text-dm-gray-100">
								{t('qrShareMdoc.sharedHeading')}
							</h3>
							<p className="mt-1 text-sm text-lm-gray-800 dark:text-dm-gray-200">
								{t('qrShareMdoc.sharedItems', { count: requestedItems.length })}
							</p>
						</div>
					)}

					{status === PROXIMITY_SHARING_STATUS.CREDENTIAL_MISMATCH && (
						<ErrorState
							title={t('qrShareMdoc.credentialMismatchHeading')}
							description={t('qrShareMdoc.credentialMismatch')}
						/>
					)}

					{status === PROXIMITY_SHARING_STATUS.SHARING_FAILED && (
						<TransferProgress failed itemCount={requestedItems.length} t={t} />
					)}
				</div>
				<div className="flex min-h-16 shrink-0 items-center justify-end border-t border-lm-gray-400 px-5 py-3 dark:border-dm-gray-600 sm:px-6">
					{status === PROXIMITY_SHARING_STATUS.SCAN && requiresUserGesture && <Button variant="primary" onClick={onConnect}>{t('qrShareMdoc.connectToVerifier')}</Button>}
					{status === PROXIMITY_SHARING_STATUS.CONNECTION_FAILED && <div className="flex w-full justify-between gap-2"><Button onClick={onClose}>{t('messagePopup.close')}</Button><Button variant="primary" onClick={onConnect}>{t('common.tryAgain')}</Button></div>}
					{status === PROXIMITY_SHARING_STATUS.REVIEW && <div className="flex w-full justify-between gap-2"><Button onClick={onCancel}>{t('common.cancel')}</Button><Button variant="primary" onClick={onConsent}>{t('qrShareMdoc.shareItems', { count: requestedItems.length })}</Button></div>}
					{status === PROXIMITY_SHARING_STATUS.SUCCESS && <Button variant="primary" onClick={onClose}>{t('qrShareMdoc.done')}</Button>}
					{[PROXIMITY_SHARING_STATUS.CREDENTIAL_MISMATCH, PROXIMITY_SHARING_STATUS.SHARING_FAILED].includes(status) && <Button variant="primary" onClick={onClose}>{t('messagePopup.close')}</Button>}
				</div>
			</div>
		</PopupLayout>
	);
};

export default ProximitySharingPopup;
