import React from 'react';

function SeparatorLine({ children, className }) {
	return (
		<div className={`${className} dark:text-white flex flex-row flex-nowrap items-stretch justify-between`}>
			<div className="flex flex-col flex-nowrap grow shrink items-stretch justify-between">
				<div className="grow shrink border-b-2 border-b-solid border-b-gray-300" />
				<div className="grow shrink" />
			</div>
			{children && (
				<>
					<div className="grow-0 shrink-0 ml-4 mr-4">
						{children}
					</div>
					<div className="flex flex-col flex-nowrap grow shrink items-stretch justify-between">
						<div className="grow shrink border-b-2 border-b-solid border-b-gray-300" />
						<div className="grow shrink" />
					</div>
				</>
			)}
		</div>
	);
}

export default SeparatorLine;
