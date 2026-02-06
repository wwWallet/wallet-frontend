import React, { ReactNode, useEffect, useRef } from 'react';


const Dialog = ({
	children,
	open,
	onCancel,
}: {
	children: ReactNode,
	open: boolean,
	onCancel: () => void,
}) => {
	const dialog = useRef<HTMLDialogElement>();

	useEffect(
		() => {
			if (dialog.current) {
				if (open) {
					dialog.current.showModal();
				} else {
					dialog.current.close();
				}
			}
		},
		[dialog, open],
	);

	return (
		<dialog
			ref={dialog}
			className="p-4 pt-8 text-center md:space-y-6 sm:p-8 bg-lm-gray-50 dark:bg-dm-gray-950 border border-lm-gray-400 dark:border-dm-gray-600 rounded-lg backdrop:bg-black/80"
			style={{ minWidth: '30%' }}
			onCancel={onCancel}
		>
			{children}
		</dialog>
	);
};


export default Dialog;
