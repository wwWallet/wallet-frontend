import React, { useMemo } from 'react';
import { formatDate } from '../../functions/DateFormat';
import { getLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';
import JsonViewer from '../JsonViewer/JsonViewer';
import { IoIosSend } from "react-icons/io";
import { TbAsterisk } from "react-icons/tb";
import useScreenType from '../../hooks/useScreenType';

const Legend = ({ showRequired, showRequested, t }) => {
	if (!showRequired && !showRequested) return null;
	return (
		<div
			className="mb-2 flex justify-end"
			aria-label={t('credentialInfo.legendAriaLabel')}
		>
			<div className='flex flex-col py-[1px] px-2 items-end w-auto text-[11px] italic text-gray-600 dark:text-gray-300 border border-gray-200 rounded-sm dark:border-gray-400/40'>
				{showRequired && (
					<span className="inline-flex items-center gap-1" title={t('credentialInfo.legendRequired')}>
						<span>{t('credentialInfo.legendRequired')}</span>
						<TbAsterisk className="text-primary dark:text-white" aria-hidden="true" />
					</span>
				)}
				{showRequested && (
					<span className="inline-flex items-center gap-1" title={t('credentialInfo.legendRequested')}>
						<span>{t('credentialInfo.legendRequested')}</span>
						<IoIosSend className="text-primary dark:text-white" aria-hidden="true" />
					</span>
				)}
			</div>
		</div>
	);
};

const getLabelAndDescriptionByLang = (displayArray, lang, fallbackLang) => {
	const match =
		displayArray.find(d => getLanguage(d.lang) === lang) ||
		displayArray.find(d => getLanguage(d.lang) === fallbackLang) ||
		displayArray[0] || {};

	return {
		label: match.label || '',
		description: match.description || '',
	};
};

const getValueByPath = (path, obj) => {
	if (!Array.isArray(path) || path.length === 0) return undefined;

	const traverse = (segments, current) => {
		if (segments.length === 0) return current;
		const [head, ...tail] = segments;

		if (head === null && typeof current === 'object' && current !== null) {
			return Object.values(current).map(item => traverse(tail, item)).filter(v => v !== undefined);
		}

		if (current && typeof current === 'object' && head in current) {
			return traverse(tail, current[head]);
		}
		return undefined;
	};

	const result = traverse(path, obj);

	if (
		typeof result === 'object' &&
		result !== null &&
		!React.isValidElement(result) &&
		Object.keys(result).length === 0
	) {
		return undefined;
	}

	return result;
};

const addToNestedObject = (target, path, display, value, required) => {
	let current = target;
	for (let i = 0; i < path.length; i++) {
		const key = path[i] ?? '*';
		if (!current[key]) current[key] = {};
		if (i === path.length - 1) {
			current[key].display = display;
			current[key].value = value;
			current[key].required = required;
		} else {
			if (typeof current[key].value !== 'object' || current[key].value === null || React.isValidElement(current[key].value)) {
				current[key].value = {};
			}
			current = current[key].value;

		}
	}
};

const expandDisplayClaims = (claims, signedClaims) => {
	const expanded = [];

	claims.forEach(claim => {
		if (!Array.isArray(claim.path)) return;

		if (!claim.path.includes(null)) {
			expanded.push(claim);
			return;
		}

		const nullIndex = claim.path.findIndex(p => p === null);
		const basePath = claim.path.slice(0, nullIndex);
		const restPath = claim.path.slice(nullIndex + 1);
		const target = getValueByPath(basePath, signedClaims);

		if (target && typeof target === 'object') {
			const keys = Array.isArray(target) ? target.map((_, i) => i) : Object.keys(target);
			for (const key of keys) {
				expanded.push({ ...claim, path: [...basePath, key, ...restPath] });
			}
		}
	});

	return expanded;
};

const isDisplayClaim = (claim) => {
	if (!Array.isArray(claim.path)) return false;
	if (!Array.isArray(claim.display)) return false;
	return claim.display.some(d => d.lang && d.label);
};

const formatClaimValue = (value) => {

	const renderImg = (src) => (
		<img
			src={src}
			alt="Claim image"
			className="max-h-10 max-w-full rounded border"
		/>
	);

	const renderJson = (v) => (
		<div className="w-full">
			<div className="max-h-40 resize-y bg-white dark:bg-gray-800 overflow-auto border rounded px-2 rounded-xl">
				<JsonViewer value={v} />
			</div>
		</div>
	);

	if (typeof value === 'boolean') return String(value);

	// String handling
	if (typeof value === 'string') {
		const lower = value.toLowerCase();

		// Image data URI
		if (lower.startsWith('data:image/')) {
			return renderImg(value);
		}
		// Long string fallback
		if (!value.includes(' ') && value.length > 30) {
			return value.slice(0, 30) + '…';
		}
	}

	// Handle raw image bytes
	if (
		typeof value === 'object' &&
		value !== null &&
		Object.keys(value).length > 0 &&
		Object.keys(value).every(k => !isNaN(Number(k))) &&
		Object.values(value).every(v => typeof v === 'number')
	) {
		try {
			const uint8Array = new Uint8Array(Object.values(value));
			const base64 = btoa(
				String.fromCharCode.apply(null, Array.from(uint8Array))
			);
			const src = `data:image/jpeg;base64,${base64}`;
			return renderImg(src);
		} catch {
			// fallback if conversion fails
			return renderJson(value);
		}
	}

	if (typeof value === 'object') {
		return renderJson(value);
	}

	return formatDate(value, 'date');
};

const CredentialInfo = ({ parsedCredential, mainClassName = "text-sm lg:text-base w-full", fallbackClaims, requested }) => {
	const { t, i18n } = useTranslation();
	const screenType = useScreenType();
	const { language, options: { fallbackLng } } = i18n;

	const requestedFields = requested?.fields ?? null;
	const requestedDisplay = requested?.display ?? undefined;

	const signedClaims = parsedCredential?.signedClaims ?? parsedCredential?.signedJptClaims?.simple;
	const claims = parsedCredential?.metadata?.credential?.TypeMetadata?.claims;

	// Define custom claims to display from signedClaims if claims is missing
	const customClaims = fallbackClaims ? fallbackClaims :
		[
			{ path: ['given_name'], display: [{ lang: 'en', label: 'Given Name' }] },
			{ path: ['family_name'], display: [{ lang: 'en', label: 'Family Name' }] },
			{ path: ['birth_date'], display: [{ lang: 'en', label: 'Birth Date' }] },
			{ path: ['document_number'], display: [{ lang: 'en', label: 'Document Number' }] },
			{ path: ['issuance_date'], display: [{ lang: 'en', label: 'Issuance Date' }] },
			{ path: ['expiry_date'], display: [{ lang: 'en', label: 'Expiry Date' }] },
		];

	const existingCustomClaims = customClaims.filter(field => getValueByPath(field.path, signedClaims) !== undefined);

	const displayClaims = claims && Array.isArray(claims) ? claims : existingCustomClaims;

	const filteredClaims = Array.isArray(displayClaims)
		? displayClaims.filter(c => {
			// Always keep if it is a display claim
			if (isDisplayClaim(c)) return true;

			// If requestedFields exists, also keep if the path is in requestedFields
			if (requestedFields) {
				const joined = Array.isArray(c.path) ? c.path.join('.') : '';
				return requestedFields.some(field =>
					(Array.isArray(field) ? field.join('.') : field) === joined
				);
			}

			return false;
		})
		: [];

	const nestedClaims = {};

	const expandedDisplayClaims = expandDisplayClaims(filteredClaims, signedClaims);

	// Ensure parents come before children to prevent overwrite issues
	expandedDisplayClaims.sort((a, b) => a.path.length - b.path.length);

	const isWildcardRequest = requestedFields?.some(p =>
		Array.isArray(p) && p.length === 1 && p[0] === null
	);

	const requestedFieldSet = isWildcardRequest
		? null // null means all fields are requested
		: new Set(
			requestedFields?.map(p => Array.isArray(p) ? p.join('.') : p)
		);

	const pathKey = (path) => Array.isArray(path) ? path.join('.') : '';

	const pathToClaimIdx = new Map(
		expandedDisplayClaims.map((claim, idx) => [pathKey(claim.path), idx])
	);

	const syntheticClaims = [];

	if (requestedFieldSet && requestedFields) {
		requestedFields.forEach(field => {
			const pathArr = Array.isArray(field) ? field : [field];
			const joined = pathKey(pathArr);
			const value = getValueByPath(pathArr, signedClaims);

			const claimIdx = pathToClaimIdx.get(joined);

			if (claimIdx !== undefined) {
				const claim = expandedDisplayClaims[claimIdx];
				if (!claim.display || !claim.display.some(d => d.label)) {
					expandedDisplayClaims[claimIdx] = {
						...claim,
						display: [{ lang: 'en', label: joined, description: '' }]
					};
				}
			} else if (value !== undefined) {
				syntheticClaims.push({
					path: pathArr,
					display: [{ lang: 'en', label: joined, description: '' }]
				});
			}
		});
	}

	const claimsWithDisplay = [...expandedDisplayClaims, ...syntheticClaims];

	const visibleClaims =
		requestedDisplay === "hide" && requestedFieldSet
			? claimsWithDisplay.filter(claim => {
				const joinedPath = claim.path?.join('.');
				if (!joinedPath) return false;

				if (claim.required === true) return true;

				// Show if the claim is:
				// - explicitly requested
				// - a parent of a requested field
				// - a child of a requested field
				return Array.from(requestedFieldSet).some(req =>
					joinedPath === req ||
					joinedPath.startsWith(req + '.') ||
					req.startsWith(joinedPath + '.')
				);
			})
			: claimsWithDisplay;

	visibleClaims.forEach(claim => {
		if (!Array.isArray(claim.path)) return;
		if (!Array.isArray(claim.display)) return;

		const rawValue = getValueByPath(claim.path, signedClaims);
		if (rawValue === undefined) return;

		const { label, description } = getLabelAndDescriptionByLang(claim.display || [], language, fallbackLng);
		const display = { label, description };

		const formattedValue = formatClaimValue(rawValue);

		addToNestedObject(nestedClaims, claim.path, display, formattedValue, claim.required);
	});

	const requestedPaths = useMemo(() => {
		if (!requestedFields) return new Set();
		const isWildcard = requestedFields.some(p => Array.isArray(p) && p.length === 1 && p[0] === null);
		return isWildcard ? null : new Set(
			requestedFields.map(path => Array.isArray(path) ? path.join('.') : path)
		);
	}, [requestedFields]);

	// Helper: is a path requested?
	const isPathRequested = (joinedPath) => {
		if (!joinedPath) return false;
		if (!requestedPaths) return true; // wildcard => everything is requested
		for (const req of requestedPaths) {
			if (
				joinedPath === req ||
				joinedPath.startsWith(req + '.') ||
				req.startsWith(joinedPath + '.')
			) return true;
		}
		return false;
	};

	// Determine legend visibility based on visible claims
	const legendFlags = (() => {
		let showRequired = false;
		let showRequested = false;
		if (requestedFields) {
			for (const c of visibleClaims) {
				const joined = Array.isArray(c.path) ? c.path.join('.') : '';
				if (c.required === true) showRequired = true;
				if (isPathRequested(joined)) showRequested = true;
				if (showRequired && showRequested) break;
			}
		}
		return { showRequired, showRequested };
	})();

	const renderClaims = (data, currentPath = []) => {
		return Object.entries(data).map(([key, node]) => {
			const label = node.display?.label || null;
			const value = node.value;
			const fullPath = [...currentPath, key].join('.');
			const isRequested = !requestedPaths || Array.from(requestedPaths).some(requested =>
				requested === fullPath || requested.startsWith(fullPath + '.') || fullPath.startsWith(requested + '.')
			);

			const isRequired = requestedFields && node.required;
			if (!node.display) {
				return renderClaims(value, [...currentPath, key]);
			}
			if (typeof value === 'object' && !React.isValidElement(value)) {
				return (
					<div key={fullPath} className="w-full">
						<details className="pl-2 py-1 rounded-md" open={isRequested || isRequired}>
							<summary className="cursor-pointer font-semibold text-primary dark:text-white w-full">
								{label}
							</summary>
							<div className="ml-2 pl-2 my-1 flex flex-col gap-1 border-l border-primary dark:border-gray-300 dark:border-gray-600 text-primary dark:text-primary-light">
								{renderClaims(value, [...currentPath, key])}
							</div>
						</details>
					</div>
				);
			} else {
				return (
					<div
						key={fullPath}
						className={`flex flex-row sm:items-start sm:gap-2 px-2 py-1 rounded ${(isRequested || isRequired) && requestedDisplay === "highlight"
							? `bg-blue-50 shadow ${screenType === 'desktop' ? 'dark:bg-gray-600' : 'dark:bg-gray-800'}`
							: ''
							}`}
					>
						<div
							className={
								`font-semibold text-primary dark:text-white w-1/2 break-words` +
								(label && label.length > 20 && !label.includes(' ') ? ' break-all' : '')
							}
						>
							{label}:
						</div>
						<div
							className={
								`text-gray-700 dark:text-white w-1/2 flex justify-between items-start break-words` +
								(value && value.length > 20 && !value.includes(' ') ? ' break-all' : '')
							}
						>
							{value}
							{(isRequested || isRequired) && (
								<div className='flex'>
									{isRequired && (
										<TbAsterisk
											className="text-primary dark:text-white flex-shrin"
										/>
									)}
									{isRequested && (
										<IoIosSend
											title="Requested by verifier"
											className="text-primary dark:text-white flex-shrink-0"
										/>
									)}
								</div>
							)}
						</div>
					</div>
				);
			}
		});
	};
	return (
		<div className={mainClassName} data-testid="credential-info">
			{Object.keys(nestedClaims).length > 0 && (
				<div className="flex flex-col w-full gap-1">
					<Legend
						showRequired={legendFlags.showRequired}
						showRequested={legendFlags.showRequested}
						t={t}
					/>
					{renderClaims(nestedClaims)}
				</div>
			)}
		</div>
	);
};

export default CredentialInfo;
