import React, { useMemo } from 'react';
import { formatDate } from '../../functions/DateFormat';
import { getLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';
import JsonViewer from '../JsonViewer/JsonViewer';
import { IoIosSend } from "react-icons/io";

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

const addToNestedObject = (target, path, display, value) => {
	let current = target;
	for (let i = 0; i < path.length; i++) {
		const key = path[i] ?? '*';
		if (!current[key]) current[key] = {};
		if (i === path.length - 1) {
			current[key].display = display;
			current[key].value = value;
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
	if (typeof value === 'boolean') return String(value);
	if (typeof value === 'object') {
		return (
			<div className="w-full">
				<div className="max-h-40 resize-y bg-white dark:bg-gray-800 overflow-auto border rounded px-2 rounded-xl">
					<JsonViewer value={value} />
				</div>
			</div>
		);
	}
	return formatDate(value, 'date');
};

const CredentialInfo = ({ parsedCredential, mainClassName = "text-sm lg:text-base w-full", fallbackClaims, requested }) => {
	const { i18n } = useTranslation();
	const { language, options: { fallbackLng } } = i18n;

	const requestedFields = requested?.fields ?? null;
	const requestedDisplay = requested?.display ?? undefined;

	const signedClaims = parsedCredential?.signedClaims;
	const claims = parsedCredential?.metadata?.credential?.metadataDocuments?.[0]?.claims;

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
			const valid = isDisplayClaim(c);
			return valid;
		})
		: [];

	const nestedClaims = {};

	const expandedDisplayClaims = expandDisplayClaims(filteredClaims, signedClaims);

	// Ensure parents come before children to prevent overwrite issues
	expandedDisplayClaims.sort((a, b) => a.path.length - b.path.length);

	const requestedFieldSet = new Set(
		requestedFields?.map(p => Array.isArray(p) ? p.join('.') : p)
	);

	const visibleClaims = requestedDisplay === "hide"
		? expandedDisplayClaims.filter(claim => {
			const joinedPath = claim.path?.join('.');
			if (!joinedPath) return false;

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
		: expandedDisplayClaims;


	visibleClaims.forEach(claim => {
		if (!Array.isArray(claim.path)) return;
		if (!Array.isArray(claim.display)) return;

		const rawValue = getValueByPath(claim.path, signedClaims);
		if (rawValue === undefined) return;

		const { label, description } = getLabelAndDescriptionByLang(claim.display || [], language, fallbackLng);
		const display = { label, description };

		const formattedValue = formatClaimValue(rawValue);

		addToNestedObject(nestedClaims, claim.path, display, formattedValue);
	});

	const requestedPaths = useMemo(() => {
		if (!requestedFields) return new Set();
		return new Set(requestedFields.map(path =>
			Array.isArray(path) ? path.join('.') : path
		));
	}, [requestedFields]);

	const renderClaims = (data, currentPath = []) => {
		return Object.entries(data).map(([key, node]) => {
			const label = node.display?.label || null;
			const value = node.value;
			const fullPath = [...currentPath, key].join('.');
			const isRequested = Array.from(requestedPaths).some(requested =>
				requested === fullPath || requested.startsWith(fullPath + '.') || fullPath.startsWith(requested + '.')
			);

			if (!node.display) {
				return renderClaims(value, [...currentPath, key]);
			}
			if (typeof value === 'object' && !React.isValidElement(value)) {
				return (
					<div key={fullPath} className="w-full">
						<details className="pl-2 py-1 rounded-md" open={isRequested}>
							<summary className="cursor-pointer font-semibold text-primary dark:text-primary-light w-full">
								{label}
							</summary>
							<div className="ml-4 my-1 border-l border-w-1 border-gray-300 dark:border-gray-600 text-primary dark:text-primary-light">
								{renderClaims(value, [...currentPath, key])}
							</div>
						</details>
					</div>
				);
			} else {
				return (
					<div
						key={fullPath}
						className={`flex flex-row sm:items-start sm:gap-2 px-2 py-1 rounded ${isRequested && requestedDisplay === "highlight"
							? 'bg-blue-50 dark:bg-blue-900 border border-blue-300 dark:border-yellow-700'
							: ''
							}`}
					>
						<div className="font-semibold text-primary dark:text-primary-light w-1/2">
							{label}:
						</div>
						<div className="text-gray-700 dark:text-white break-words w-1/2 flex justify-between items-start">
							{value}
							{isRequested && (
								<IoIosSend
									title="Requested by verifier"
									className="text-primary dark:text-primary-light flex-shrink-0"
								/>
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
					{renderClaims(nestedClaims)}
				</div>
			)}
		</div>
	);
};

export default CredentialInfo;
