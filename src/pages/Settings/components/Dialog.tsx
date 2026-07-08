import React, { ReactNode } from 'react';
import PopupLayout from '@/components/Popups/PopupLayout';

const Dialog = ({
	children,
	open,
	onCancel,
}: {
	children: ReactNode,
	open: boolean,
	onCancel: () => void,
}) => (
	<PopupLayout isOpen={open} onClose={onCancel} padding="p-4 pt-8 sm:p-8">
		<div className="text-center md:space-y-6">
			{children}
		</div>
	</PopupLayout>
);

export default Dialog;
