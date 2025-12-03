import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const MAX_STRING_LENGTH = 100;

const JsonViewer = ({ name, value, depth = 0 }) => {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(depth === 0);
	const [showFullString, setShowFullString] = useState(false);

	const isObject = (val) => val && typeof val === 'object' && !Array.isArray(val);
	const isArray = Array.isArray;

	const toggleExpanded = () => setExpanded((prev) => !prev);
	const toggleString = () => setShowFullString((prev) => !prev);

	const indentClass = depth === 0 ? '' : 'pl-4';

	if (isArray(value)) {
		return (
			<div className={`${indentClass}`}>
				<span className="cursor-pointer text-lm-gray-900 dark:text-dm-gray-100" onClick={toggleExpanded}>
					{expanded ? '▼' : '▶'} {name && `"${name}"`}: [Array({value.length})]
				</span>
				{expanded && value.map((item, idx) => (
					<JsonViewer key={idx} name={String(idx)} value={item} depth={depth + 1} />
				))}
			</div>
		);
	}

	if (isObject(value)) {
		const keys = Object.keys(value);
		return (
			<div className={`${indentClass}`}>
				<span className="cursor-pointer text-lm-gray-900 dark:text-dm-gray-100" onClick={toggleExpanded}>
					{expanded ? '▼' : '▶'} {name && `"${name}"`}: {"{"}Object({keys.length}){"}"}
				</span>
				{expanded && keys.map((key) => (
					<JsonViewer key={key} name={key} value={value[key]} depth={depth + 1} />
				))}
			</div>
		);
	}

	let displayValue = value;
	let valueClass = 'text-lm-green dark:text-dm-green';

	if (typeof value === 'string') {
		const shouldTruncate = value.length > MAX_STRING_LENGTH;
		displayValue = showFullString || !shouldTruncate
			? `"${value}"`
			: `"${value.slice(0, MAX_STRING_LENGTH)}..."`;

		return (
			<div className={`${indentClass} break-all`}>
				<span className="text-lm-gray-800 dark:text-dm-gray-200">{name && `"${name}"`}:</span>{' '}
				<span className={valueClass}>{displayValue}</span>
				{shouldTruncate && (
					<button
						onClick={toggleString}
						className="ml-2 text-xs text-lm-gray-900 dark:text-dm-gray-100 underline"
					>
						{showFullString ? `${t('common.showLess')}` : `${t('common.showMore')}`}
					</button>
				)}
			</div>
		);
	}

	if (typeof value === 'number') {
		valueClass = 'text-lm-yellow dark:text-dm-yellow';
		displayValue = value;
	} else if (typeof value === 'boolean') {
		valueClass = 'text-lm-pink dark:text-dm-pink';
		displayValue = value ? 'true' : 'false';
	} else if (value === null) {
		valueClass = '';
		displayValue = '';
	}

	return (
		<div className={`${indentClass}`}>
			<span className="text-lm-gray-800 dark:text-dm-gray-200">{name && `"${name}"`}:</span>{' '}
			<span className={valueClass}>{displayValue}</span>
		</div>
	);
};

export default JsonViewer;
