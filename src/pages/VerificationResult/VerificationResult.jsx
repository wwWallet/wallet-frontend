import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/pro-duotone-svg-icons'; 

import Button from '@/components/Buttons/Button';

const VerificationResult = () => {
	return (
		<div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)]">
			<FontAwesomeIcon icon={faCheckCircle} className="text-8xl text-c-lm-green dark:text-c-dm-green" />

			<h2 className="mt-12 text-2xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100">
				Verification Successful!
			</h2>

			<p className="mt-3 text-c-lm-gray-700 dark:text-c-dm-gray-300">
				Your credentials have been verified successfully.
			</p>

			<Link to="/">
				<Button
					variant="cancel"
					size="lg"
					textSize="md"
					additionalClassName="mt-10"
				>
					Back to Home
				</Button>
			</Link>
		</div>
	);
};

export default VerificationResult;
