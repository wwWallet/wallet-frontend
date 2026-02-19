import React from 'react';
import * as config from '../../config';
import Logo from '../Logo/Logo';
import PoweredBy from '../Shared/PoweredBy';

export default function LoginLayout({ children, heading }: { children: React.ReactNode, heading: React.ReactNode }) {
	return (
		<section className="bg-lm-gray-100 dark:bg-dm-gray-900 min-h-dvh flex flex-col">
			<div className="grow flex flex-col items-center justify-center px-6 py-8">
				<Logo aClassName='mb-6' imgClassName='w-20' />

				<h1 className="text-3xl mb-8 font-bold leading-tight tracking-tight text-lm-gray-900 text-center dark:text-white">
					{heading}
				</h1>

				<div className="relative w-full sm:max-w-md xl:p-0">
					{children}
				</div>
			</div>

			<footer className="py-4">
				<PoweredBy
					className="text-sm text-lm-gray-800 dark:text-dm-gray-200 text-center"
					linkClassName="underline font-semibold text-lm-gray-800 dark:text-dm-gray-300"
				/>
				<p className="hidden">v{config.APP_VERSION}</p>
			</footer>
		</section>
	);
}
