import { CheckCircle } from 'lucide-react';
import React from 'react';

const VerificationResult = () => {
	return (
		<>
			<div className="flex flex-col items-center justify-center min-h-screen">
				<CheckCircle size={100} className="text-c-lm-green dark:text-c-dm-green" />
				<h2 className="mt-4 text-2xl font-bold text-c-lm-gray-800 dark:text-c-dm-gray-200">
					Verification Successful!
				</h2>
			</div>
		</>
	);
};

export default VerificationResult;
