import React from "react";

function passwordStrength(password: string): number {
	const lengthScore = password.length >= 8 ? 25 : 0;
	const capitalScore = /[A-Z]/.test(password) ? 25 : 0;
	const numberScore = /[0-9]/.test(password) ? 25 : 0;
	const specialCharScore = /[^A-Za-z0-9]/.test(password) ? 25 : 0;

	return lengthScore + capitalScore + numberScore + specialCharScore;
};

export type Props = {
	label: React.ReactNode,
	password: string,
}

export default function PasswordStrength({ label, password }: Props) {
	const value = passwordStrength(password);
	const colorClass = (
		value < 50
			? 'bg-c-lm-red dark:bg-c-dm-red'
			: value >= 50 && value < 100
				? 'bg-c-lm-yellow dark:bg-c-dm-yellow'
				: 'bg-c-lm-green dark:bg-c-dm-green'
	);
	return (
		<div className="flex items-center mt-2">
			<p className="text-sm font-medium text-c-lm-gray-700 dark:text-c-dm-gray-300 mr-4">{label}</p>
			<div className="flex flex-1 h-2 bg-c-lm-gray-200 dark:bg-c-dm-gray-700 rounded-lg">
				<div
					className={`h-full rounded-full ${colorClass}`}
					style={{ width: `${value}%` }}
				/>
			</div>
		</div>
	);
}
