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
			? 'bg-lm-red dark:bg-dm-red'
			: value >= 50 && value < 100
				? 'bg-lm-yellow dark:bg-dm-yellow'
				: 'bg-lm-green dark:bg-dm-green'
	);
	return (
		<div className="flex items-center mt-1">
			<p className="text-sm text-lm-gray-700 dark:text-dm-gray-300 mr-2">{label}</p>
			<div className="flex flex-1 h-4 rounded-full border border-lm-gray-400 dark:border-dm-gray-600">
				<div
					className={`h-full rounded-full ${colorClass}`}
					style={{ width: `${value}%` }}
				/>
			</div>
		</div>
	);
}
