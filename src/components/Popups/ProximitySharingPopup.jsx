import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { Check, CircleAlert, CircleCheckBig, LoaderCircle, LockKeyhole } from 'lucide-react';
import { formatDate, isCborDate } from 'wallet-common';
import { getLanguage } from '@/i18n';
import { truncateByWords } from '@/utils';
import PopupLayout from './PopupLayout';
import Button from '../Buttons/Button';

const steps = ['scan', 'connect', 'review', 'share'];

export const PROXIMITY_SHARING_STATUS = Object.freeze({
	SCAN: 'scan',
	SELECTING_DEVICE: 'selectingDevice',
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
	if ([PROXIMITY_SHARING_STATUS.SELECTING_DEVICE, PROXIMITY_SHARING_STATUS.PAIRING, PROXIMITY_SHARING_STATUS.WAITING_FOR_REQUEST, PROXIMITY_SHARING_STATUS.CONNECTION_FAILED].includes(status)) return 1;
	if ([PROXIMITY_SHARING_STATUS.REVIEW, PROXIMITY_SHARING_STATUS.CREDENTIAL_MISMATCH].includes(status)) return 2;
	if ([PROXIMITY_SHARING_STATUS.SHARING, PROXIMITY_SHARING_STATUS.SUCCESS, PROXIMITY_SHARING_STATUS.SHARING_FAILED].includes(status)) return 3;
	return 0;
};

// Turns identifier-style names such as `firstName` or `first_name` into readable labels.
const formatFieldLabel = (name) => String(name)
	.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
	.replace(/[_-]+/g, ' ')
	.replace(/\s+/g, ' ')
	.trim()
	.replace(/^./, character => character.toUpperCase());

// Converts string or array paths into comparable, case- and separator-insensitive segments.
const normalizePath = (field) => (Array.isArray(field) ? field : String(field).split('.'))
	.filter(segment => segment !== null && segment !== undefined && segment !== '')
	.map(segment => String(segment).replace(/[^a-z0-9]/gi, '').toLowerCase());

// Used when deciding whether a claim (e.g. academicDetails.degree) belongs to a requested field (e.g. academicDetails).
const pathsAreRelated = (left, right) => {
	const leftPath = normalizePath(left);
	const rightPath = normalizePath(right);
	const leftContainsRight = rightPath.length > 0 && leftPath.some((_, start) =>
		rightPath.every((segment, index) => leftPath[start + index] === segment));
	const rightContainsLeft = leftPath.length > 0 && rightPath.some((_, start) =>
		leftPath.every((segment, index) => rightPath[start + index] === segment));

	return leftContainsRight || rightContainsLeft;
};

const getValueAtPath = (source, path) => path.reduce((value, segment) => {
	if (value instanceof Map) return value.get(segment);
	return value?.[segment];
}, source);

const findValueByKey = (source, targetKey, visited = new WeakSet()) => {
	if (!source || typeof source !== 'object') return undefined;
	if (visited.has(source)) return undefined;
	visited.add(source);

	const entries = source instanceof Map ? Array.from(source.entries()) : Object.entries(source);
	const normalizedTargetKey = normalizePath(targetKey).at(-1);
	const directMatch = entries.find(([key]) => normalizePath(key).at(-1) === normalizedTargetKey);
	if (directMatch) return directMatch[1];

	for (const [, value] of entries) {
		const match = findValueByKey(value, targetKey, visited);
		if (match !== undefined) return match;
	}
	return undefined;
};

const imageSourceForValue = (value) => {
	if (typeof value === 'string' && value.toLowerCase().startsWith('data:image/')) return value;

	const byteEntries = value && typeof value === 'object' && !Array.isArray(value)
		? Object.entries(value)
		: [];
	const isSerializedByteString = byteEntries.length > 0 && byteEntries.every(([key, byte], index) =>
		Number(key) === index && Number.isInteger(byte) && byte >= 0 && byte <= 255);
	const bytes = value instanceof Uint8Array
		? value
		: isSerializedByteString
			? new Uint8Array(byteEntries.map(([, byte]) => byte))
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

const StructuredValue = ({ value, label }) => {
	if (isCborDate(value)) return <span>{formatDate(value, 'date')}</span>;

	const imageSource = imageSourceForValue(value);
	if (imageSource) {
		return <img
			src={imageSource}
			alt={label}
			className="mt-1 max-h-24 max-w-full rounded-md border border-lm-gray-400 bg-white object-contain dark:border-dm-gray-600"
		/>;
	}

	if (value instanceof Map || (value && typeof value === 'object')) {
		const entries = value instanceof Map ? Array.from(value.entries()) : Object.entries(value);
		if (entries.length === 0) return <span>—</span>;

		return <dl className="mt-1 space-y-1 border-l border-lm-gray-400 pl-3 dark:border-dm-gray-600">
			{entries.map(([key, nestedValue]) => (
				<div key={key} className="min-w-0">
					<dt className="font-medium text-lm-gray-800 dark:text-dm-gray-200">{formatFieldLabel(key)}:</dt>
					<dd className="ml-2 min-w-0 wrap-break-word text-lm-gray-700 dark:text-dm-gray-300">
						<StructuredValue value={nestedValue} label={`${label} ${formatFieldLabel(key)}`} />
					</dd>
				</div>
			))}
		</dl>;
	}

	return <span>{displayValue(value)}</span>;
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
	<h3 className="mt-4 text-lg font-bold text-lm-red dark:text-dm-red">{title}</h3>
	<p className="mt-2 max-w-sm text-base text-lm-gray-800 dark:text-dm-gray-200">{description}</p>
</div>;

const TransferProgress = ({ failed, itemCount, t }) => <div className="flex h-full flex-col items-center justify-center text-center">
	{failed ? (
		<>
			<CircleAlert className="h-20 w-20 text-lm-red dark:text-dm-red" strokeWidth={1.5} aria-hidden="true" />
			<h3 className="mt-4 text-lg font-bold text-lm-red dark:text-dm-red">
				{t('qrShareMdoc.sharingFailedHeading')}
			</h3>
			<p className="mt-2 text-base text-lm-gray-800 dark:text-dm-gray-200">{t('qrShareMdoc.connectionLost')}</p>
		</>
	) : (
		<>
			<h3 className="text-lg font-bold text-lm-gray-900 dark:text-dm-gray-100">{t('qrShareMdoc.sharingHeading')}</h3>
			<p className="mt-1 text-base text-lm-gray-800 dark:text-dm-gray-200">{t('qrShareMdoc.keepOpen')}</p>
			<LoaderCircle className="mt-7 h-20 w-20 animate-spin text-primary dark:text-brand-light" strokeWidth={1.5} aria-hidden="true" />
			<p className="mt-5 text-base font-semibold text-lm-gray-900 dark:text-dm-gray-100">
				{t('qrShareMdoc.sendingItems', { count: itemCount })}
			</p>
		</>
	)}
</div>;

const ProximitySharingPopup = ({ isOpen, fullScreen, status, qrContent, credential, requestedFields, mdocTypeDetails, bluetoothPairingCancelled, requiresUserGesture, onConnect, onConsent, onCancel, onClose }) => {
	const { t, i18n } = useTranslation();
	const [showAllNotShared, setShowAllNotShared] = useState(false);
	const claims = credential?.parsedCredential?.metadata?.credential?.TypeMetadata?.claims ?? [];
	const signedClaims = credential?.parsedCredential?.signedClaims;
	const claimIsRequested = (claim) => Array.isArray(claim.path)
		&& requestedFields.some(field => pathsAreRelated(claim.path, field));
	const claimForField = (field) => {
		const normalizedField = normalizePath(field).at(-1);
		return claims.find(claim => Array.isArray(claim.path) && normalizePath(claim.path).at(-1) === normalizedField);
	};
	const labelForClaim = (claim, fallback) => {
		const displays = claim?.display ?? [];
		const activeLanguage = getLanguage(i18n.language);
		const fallbackLanguage = getLanguage(i18n.options.fallbackLng);
		const activeLanguageLabel = displays.find(display => getLanguage(display.locale) === activeLanguage)?.label;
		const fallbackLanguageLabel = displays.find(display => getLanguage(display.locale) === fallbackLanguage)?.label;

		return formatFieldLabel(activeLanguageLabel
			?? fallbackLanguageLabel
			?? displays[0]?.label
			?? fallback);
	};
	const valueForField = (field, claim) => {
		const pathValue = Array.isArray(claim?.path) ? getValueAtPath(signedClaims, claim.path) : undefined;
		return pathValue ?? findValueByKey(signedClaims, field);
	};
	const requestedItems = requestedFields.map(field => {
		const claim = claimForField(field);
		const value = valueForField(field, claim);
		return { field, label: labelForClaim(claim, field), value };
	});
	const notSharedLabels = claims
		.filter(claim => Array.isArray(claim.path) && !claimIsRequested(claim) && valueForField(claim.path.at(-1), claim) !== undefined)
		.map(claim => labelForClaim(claim, claim.path.at(-1)).toLowerCase())
		.filter((label, index, labels) => labels.indexOf(label) === index);
	const notSharedSummary = notSharedLabels.length > 0 ? notSharedLabels.join(', ') : t('qrShareMdoc.nothingElse');
	const { text: truncatedNotShared, truncated: hasHiddenNotShared } = truncateByWords(notSharedSummary, 60);
	const visibleNotSharedSummary = showAllNotShared ? notSharedSummary : truncatedNotShared;
	const isLoadingStatus = [
		PROXIMITY_SHARING_STATUS.SELECTING_DEVICE,
		PROXIMITY_SHARING_STATUS.WAITING_FOR_REQUEST,
		PROXIMITY_SHARING_STATUS.SHARING,
	].includes(status);
	return (
		<PopupLayout isOpen={isOpen} onClose={onClose} fullScreen={fullScreen} useDefaultContentPadding={false} shouldCloseOnOverlayClick={false}>
			<div className={`flex flex-col ${fullScreen
				? 'h-full'
				: bluetoothPairingCancelled
					? 'h-[min(720px,calc(90dvh-2rem))]'
					: 'h-[min(640px,calc(90dvh-2rem))]'}`}>
				<header className="shrink-0 px-5 pt-5 sm:px-6 sm:pt-6">
					<h2 className="text-lg font-bold text-primary dark:text-white">
						{t('qrShareMdoc.presentCredential')}
					</h2>
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
							{bluetoothPairingCancelled && (
								<div
									className="mt-4 flex max-w-sm items-center gap-2 rounded-lg bg-lm-yellow/15 px-3 py-2 text-left text-sm font-medium text-lm-gray-900 dark:bg-dm-yellow/15 dark:text-dm-gray-100"
									role="status"
								>
									<CircleAlert className="shrink-0 text-lm-yellow dark:text-dm-yellow" size={18} aria-hidden="true" />
									<span>{t('qrShareMdoc.pairingCancelled')}</span>
								</div>
							)}
							<div className="mt-5 rounded-lg bg-white p-4">
								<QRCode
									value={qrContent}
									size={200}
									style={{ height: 'auto', maxWidth: '100%', width: 'clamp(160px, 24dvh, 200px)' }}
								/>
							</div>
							<p className="mt-5 max-w-sm text-base text-lm-gray-800 dark:text-dm-gray-200">
								{t('qrShareMdoc.scanInstructions')}
							</p>
						</div>
					)}

					{status === PROXIMITY_SHARING_STATUS.CONNECTION_FAILED && (
						<ErrorState
							title={t('qrShareMdoc.connectionFailedHeading')}
							description={t('qrShareMdoc.connectionFailed')}
						/>
					)}

					{[PROXIMITY_SHARING_STATUS.SELECTING_DEVICE, PROXIMITY_SHARING_STATUS.PAIRING].includes(status) && (
						<div className="flex h-full flex-col items-center justify-center text-center">
							<LoaderCircle
								className="h-16 w-16 animate-spin text-primary dark:text-brand-light"
								strokeWidth={1.5}
								aria-hidden="true"
							/>
							<h3 className="mt-5 text-lg font-bold text-lm-gray-900 dark:text-dm-gray-100">
								{t('qrShareMdoc.connectingHeading')}
							</h3>
							<p className="mt-2 max-w-sm text-base text-lm-gray-800 dark:text-dm-gray-200">
								{status === PROXIMITY_SHARING_STATUS.SELECTING_DEVICE
									? t('qrShareMdoc.connectingInstructions')
									: t('qrShareMdoc.pairingInstructions')}
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
							<p className="mt-2 max-w-sm text-base text-lm-gray-800 dark:text-dm-gray-200">
								{t('qrShareMdoc.waitingForRequest')}
							</p>
						</div>
					)}

					{status === PROXIMITY_SHARING_STATUS.REVIEW && (
						<div className="mx-auto w-full max-w-md">
							<h3 className="text-center text-lg font-bold text-lm-gray-900 dark:text-dm-gray-100">
								{t('qrShareMdoc.reviewHeading')}
							</h3>
							<p className="mt-1 text-center text-base text-lm-gray-800 dark:text-dm-gray-200">
								{t('qrShareMdoc.reviewDescription')}
							</p>
							<ul className="mt-4 overflow-hidden rounded-lg border border-lm-gray-400 bg-lm-gray-50 dark:border-dm-gray-600 dark:bg-dm-gray-800">
								{requestedItems.map(item => (
									<li
										key={item.field}
										className="flex min-h-16 items-center gap-3 border-b border-lm-gray-400 px-3 py-1.5 last:border-b-0 dark:border-dm-gray-600"
									>
										<div className="min-w-0 flex-1">
											<p className="truncate text-base font-semibold text-lm-gray-900 dark:text-dm-gray-100">
												{item.label}
											</p>
											<div className="text-base text-lm-gray-700 dark:text-dm-gray-300">
												<StructuredValue value={item.value} label={item.label} />
											</div>
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
							<div className="mt-4 flex items-start gap-2 text-base text-lm-gray-700 dark:text-dm-gray-300">
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
							<p className="mt-1 text-base text-lm-gray-800 dark:text-dm-gray-200">
								{t('qrShareMdoc.sharedItems', { count: requestedItems.length })}
							</p>
						</div>
					)}

					{status === PROXIMITY_SHARING_STATUS.CREDENTIAL_MISMATCH && (
						<ErrorState
							title={t('qrShareMdoc.credentialMismatchHeading')}
							description={mdocTypeDetails?.requestedDocType && mdocTypeDetails?.credentialDocType
								? <strong>{t('qrShareMdoc.credentialTypeMismatch', {
									requestedType: mdocTypeDetails.requestedDocType,
									credentialType: mdocTypeDetails.credentialDocType,
								})}</strong>
								: t('qrShareMdoc.credentialMismatch')}
						/>
					)}

					{status === PROXIMITY_SHARING_STATUS.SHARING_FAILED && (
						<TransferProgress failed itemCount={requestedItems.length} t={t} />
					)}
				</div>
				<div className={`flex min-h-16 shrink-0 items-center justify-end px-5 py-3 sm:px-6 ${isLoadingStatus ? '' : 'border-t border-lm-gray-400 dark:border-dm-gray-600'}`}>
					{status === PROXIMITY_SHARING_STATUS.SCAN && (
						<div className="flex w-full justify-between gap-2">
							<Button onClick={onCancel}>{t('common.cancel')}</Button>
							{requiresUserGesture && (
								<Button variant="primary" onClick={onConnect}>
									{t('qrShareMdoc.connectToVerifier')}
								</Button>
							)}
						</div>
					)}
					{status === PROXIMITY_SHARING_STATUS.PAIRING && <Button onClick={onCancel}>{t('common.cancel')}</Button>}
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
