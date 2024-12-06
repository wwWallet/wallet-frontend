import { useState } from 'react';
import MessagePopup from '../components/Popups/MessagePopup';

type ErrorHandlerProps = {
	title: string;
	description: string;
};

export const ErrorHandler = ({
	title,
	description,
}: ErrorHandlerProps) => {
	const [showMessage, setShowMessage] = useState(false);

	const onClose = () => {
		setShowMessage(false);
		window.history.replaceState({}, '', `${window.location.pathname}`);
	};

	return (
		<>
			{showMessage &&
				<MessagePopup
					type="error"
					message={{ title, description }}
					onClose={onClose}
				/>
			}
		</>
	);
};
