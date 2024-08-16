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
			? 'bg-red-500'
			: value >= 50 && value < 100
				? 'bg-yellow-500'
				: 'bg-green-500'
	);
	return (
		<div className="flex items-center mt-1">
			<p className="text-sm text-gray-600 mr-2">{label}</p>
			<div className="flex flex-1 h-4 bg-lightgray rounded-full border border-gray-300">
				<div
					className={`h-full rounded-full ${colorClass}`}
					style={{ width: `${value}%` }}
				/>
			</div>
		</div>
	);
}
