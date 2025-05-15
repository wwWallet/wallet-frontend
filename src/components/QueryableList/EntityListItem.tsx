import React from 'react';
import { highlightBestSequence } from '@/components/QueryableList/highlightBestSequence';

type EntityListItemProps = {
	primaryData: any;
	secondaryData?: any;
	searchQuery: string;
};

const DisplayNode = ({ primaryData, secondaryData, searchQuery }: EntityListItemProps) => {
	const hasTextColor = !!primaryData.text_color;
	const hasBackgroundColor = !!primaryData.background_color;
	const shouldUseCustomStyle = hasTextColor && hasBackgroundColor;

	const logoStyle = shouldUseCustomStyle
		? {
			backgroundColor: primaryData.background_color,
			color: primaryData.text_color,
		}
		: {
			backgroundColor: '#939393',
			color: 'white',
		};

	return (
		<span className="flex flex-col justify-between w-full gap-3 leading-tight break-words">
			<span className="flex justify-start items-center gap-3 w-full">
				<div
					className="h-16 w-16 text-2xl flex justify-center items-center rounded-lg shrink-0 relative"
					style={logoStyle}
				>
					{primaryData.logo?.uri ? (
						<img
							src={primaryData.logo.uri}
							alt={primaryData.logo.alt_text || primaryData.name}
							className="max-h-8 max-w-8 align-middle inline"
						/>
					) : (
						<p className="font-bold">{primaryData.name?.charAt(0)}</p>
					)}

					<div className='absolute border border-white/15 rounded-lg w-full h-full' />
				</div>

				<div className='grid'>
					<span
						className="truncate font-semibold"
						title={primaryData.name}
					>
						{highlightBestSequence(primaryData.name, searchQuery)}
					</span>

					{secondaryData && 
						<span className="truncate text-c-lm-gray-700 dark:text-c-dm-gray-300 text-sm mt-1">
							{highlightBestSequence(secondaryData?.name, searchQuery)}
						</span>
					}
				</div>
			</span>

		</span>
	);
};

export default DisplayNode;
