import React from 'react';

function SeparatorLine({ children }) {
	return (
		<div className="font-medium text-c-lm-gray-700 dark:text-c-dm-gray-300 flex flex-row flex-nowrap items-stretch justify-between">
			<div className="flex flex-col flex-nowrap grow shrink items-stretch justify-between">
				<div className="grow shrink border-b border-b-c-lm-gray-400 dark:border-b-c-dm-gray-600" />
				
				<div className="grow shrink" />
			</div>

			{children && (
				<>
					<div className="grow-0 shrink-0 ml-4 mr-4">
						{children}
					</div>

					<div className="flex flex-col flex-nowrap grow shrink items-stretch justify-between">
						<div className="grow shrink border-b border-b-c-lm-gray-400 dark:border-b-c-dm-gray-600" />

						<div className="grow shrink" />
					</div>
				</>
			)}
		</div>
	);
}

export default SeparatorLine;
