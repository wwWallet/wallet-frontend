import React from 'react';
import { highlightBestSequence } from '@/components/QueryableList/highlightBestSequence';

export type CredentialDisplayNodeProps = {
	displayData: any;
	issuerDisplay?: any;
	searchQuery: string;
};

const CredentialDisplayNode = ({ displayData, issuerDisplay, searchQuery }: CredentialDisplayNodeProps) => {
	const hasTextColor = !!displayData.text_color;
	const hasBackgroundColor = !!displayData.background_color;
	const shouldUseCustomStyle = hasTextColor && hasBackgroundColor;

	const logoStyle = shouldUseCustomStyle
		? {
			backgroundColor: displayData.background_color,
			color: displayData.text_color,
		}
		: {
			backgroundColor: '#939393',
			color: 'white',
		};

	const issuerHasBackgroundColor = !!issuerDisplay?.background_color;
	const issuerLogoStyle = issuerHasBackgroundColor
		? { backgroundColor: issuerDisplay.background_color }
		: { backgroundColor: 'white' };

	return (
		<span className="flex flex-col justify-between w-full gap-2 leading-tight break-words">
			<span className="flex justify-start items-center gap-1 w-full">
				<div
					className="h-10 w-10 text-2xl flex justify-center items-center border-[0.5px] border-gray-200 rounded-md shrink-0"
					style={logoStyle}
				>
					{displayData.logo?.uri ? (
						<img
							src={displayData.logo.uri}
							alt={displayData.logo.alt_text || displayData.name}
							className="max-h-8 max-w-8 align-middle inline"
						/>
					) : (
						<p className="font-bold">{displayData.name?.charAt(0)}</p>
					)}
				</div>
				<span>{highlightBestSequence(displayData.name, searchQuery)}</span>
			</span>

			{issuerDisplay && (
				<span className="flex w-max mt-1 px-2 py-1 text-sm rounded-md items-center gap-1 font-light bg-gray-200 dark:bg-gray-600 whitespace-nowrap">
					{issuerDisplay?.logo?.uri && (
						<div
							className="h-5 w-5 flex justify-center items-center rounded-md shrink-0 border-[0.5px] border-gray-200"
							style={issuerLogoStyle}
						>
							<img
								src={issuerDisplay.logo.uri}
								alt={issuerDisplay.logo.alt_text || issuerDisplay.name}
								className="h-4 w-auto align-middle inline"
							/>
						</div>
					)}
					<span>{highlightBestSequence(issuerDisplay?.name, searchQuery)}</span>
				</span>
			)}
		</span>
	);
};

export default CredentialDisplayNode;
