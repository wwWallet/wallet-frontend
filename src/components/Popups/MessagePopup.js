// MessagePopup.js
import React from 'react';
import { FaShare } from 'react-icons/fa';

const MessagePopup = ({ type, message, onClose }) => {
	const { title, description } = message || {};

	const titleColor = type === 'error' ? 'text-red-500' : 'text-custom-blue';
	const descriptionColor = type === 'error' ? 'text-red-500' : '';

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="absolute inset-0 bg-black opacity-50" onClick={() => onClose()}></div>

			<div className="bg-white p-4 rounded-lg shadow-lg w-full lg:w-[33.33%] sm:w-[66.67%] z-10 relative m-4">
				<div class="flex items-start justify-between border-b rounded-t dark:border-gray-600">

					<h2 className={`text-lg font-bold mb-2 flex items-center ${titleColor}`}>
						<FaShare size={20} className="inline mr-1 mb-1" />
						{title}
					</h2>
					<button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={() => onClose()}>
						<svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
							<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
						</svg>
					</button>
				</div>
				<hr className="mb-2 border-t border-custom-blue/80" />
				<p className={`mb-2 mt-4 ${descriptionColor}`}>
					{description}
				</p>
				<div className="flex justify-end space-x-2 pt-4">
					<button
						type="button"
						className="rounded-md text-sm border border-transparent shadow-sm px-4 py-2 bg-gray-500 text-white hover:bg-gray-600"
						onClick={onClose}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};

export default MessagePopup;
