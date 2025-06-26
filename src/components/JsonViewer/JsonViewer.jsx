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
				<span className="cursor-pointer text-blue-700 dark:text-blue-300" onClick={toggleExpanded}>
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
				<span className="cursor-pointer text-blue-700 dark:text-blue-300" onClick={toggleExpanded}>
					{expanded ? '▼' : '▶'} {name && `"${name}"`}: {"{"}Object({keys.length}){"}"}
				</span>
				{expanded && keys.map((key) => (
					<JsonViewer key={key} name={key} value={value[key]} depth={depth + 1} />
				))}
			</div>
		);
	}

	let displayValue = value;
	let valueClass = 'text-green-700 dark:text-green-400';

	if (typeof value === 'string') {
		const shouldTruncate = value.length > MAX_STRING_LENGTH;
		displayValue = showFullString || !shouldTruncate
			? `"${value}"`
			: `"${value.slice(0, MAX_STRING_LENGTH)}..."`;

		return (
			<div className={`${indentClass} break-words`}>
				<span className="text-gray-800 dark:text-white">{name && `"${name}"`}:</span>{' '}
				<span className={valueClass}>{displayValue}</span>
				{shouldTruncate && (
					<button
						onClick={toggleString}
						className="ml-2 text-xs text-blue-700 dark:text-blue-300 underline"
					>
						{showFullString ? `${t('common.showLess')}` : `${t('common.showMore')}`}
					</button>
				)}
			</div>
		);
	}

	if (typeof value === 'number') {
		valueClass = 'text-yellow-600 dark:text-yellow-400';
		displayValue = value;
	} else if (typeof value === 'boolean') {
		valueClass = 'text-pink-700 dark:text-pink-400';
		displayValue = value ? 'true' : 'false';
	} else if (value === null) {
		valueClass = '';
		displayValue = '';
	}

	return (
		<div className={`${indentClass}`}>
			<span className="text-gray-800 dark:text-white">{name && `"${name}"`}:</span>{' '}
			<span className={valueClass}>{displayValue}</span>
		</div>
	);
};

export default JsonViewer;
