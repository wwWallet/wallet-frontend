import React from 'react';
import { useHttpProxy } from '@/lib/services/HttpProxy/HttpProxy';
import { highlightBestSequence } from '@/components/QueryableList/highlightBestSequence';
import { useProxiedImage } from '@/hooks/useProxiedImage'
type EntityListItemProps = {
	primaryData: any;
	secondaryData?: any;
	searchQuery: string;
};

const DisplayNode = ({ primaryData, secondaryData, searchQuery }: EntityListItemProps) => {
	const proxy = useHttpProxy();

	const primaryLogoSrc = useProxiedImage(primaryData?.logo?.uri);
	const secondaryImageSrc = useProxiedImage(secondaryData?.logo?.uri);

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

	const issuerHasBackgroundColor = !!secondaryData?.background_color;
	const issuerLogoStyle = issuerHasBackgroundColor
		? { backgroundColor: secondaryData.background_color }
		: { backgroundColor: 'white' };

	return (
		<span className="flex flex-col justify-between w-full gap-2 leading-tight break-words">
			<span className="flex justify-start items-center gap-2 w-full">
				<div
					className="h-10 w-10 text-2xl flex justify-center items-center border-[0.5px] border-gray-200 rounded-md shrink-0"
					style={logoStyle}
				>
					{primaryLogoSrc ? (
						<img
							src={primaryLogoSrc}
							alt={primaryData.logo.alt_text || primaryData.name}
							className="max-h-8 max-w-8 align-middle inline"
						/>
					) : (
						<p className="font-bold">{primaryData.name?.charAt(0)}</p>
					)}
				</div>
				<span
					className="line-clamp-2 max-w-full"
					title={primaryData.name}
				>
					{highlightBestSequence(primaryData.name, searchQuery)}
				</span>
			</span>

			{secondaryData && (
				<span className="flex max-w-max mt-1 px-2 py-1 text-sm rounded-md items-center gap-2 font-light bg-gray-200 dark:bg-gray-600 whitespace-nowrap">
					{secondaryImageSrc && (
						<div
							className="h-5 w-5 flex justify-center items-center rounded-sm shrink-0 border-[0.5px] border-gray-200"
							style={issuerLogoStyle}
						>
							<img
								src={secondaryImageSrc}
								alt={secondaryData.logo.alt_text || secondaryData.name}
								className="max-h-4 max-w-4 w-auto align-middle inline"
							/>
						</div>
					)}
					<span className="truncate">
						{highlightBestSequence(secondaryData?.name, searchQuery)}
					</span>
				</span>
			)}
		</span>
	);
};

export default DisplayNode;
