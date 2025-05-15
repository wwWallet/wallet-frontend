import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { faGlobe, faMoon } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import * as config from '@/config';

import useScreenType from '@/hooks/useScreenType';

import AnimatedArrow from '@/components/Shared/AnimatedArrow';

import Logo from '@/components/Logo/Logo';
import Button from '@/components/Buttons/Button';
import ThemeSelector from '@/components/ThemeSelector/ThemeSelector';
import PWAInstallPrompt from '@/components/PWAInstall/PWAInstallPrompt';
import LanguageSelector from '@/components/LanguageSelector/LanguageSelector';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
	//General
	const { t } = useTranslation();
	const screenType = useScreenType();

	//Render
	return (
		<section className="bg-c-lm-gray-100 dark:bg-c-dm-gray-900 min-h-dvh w-full flex flex-row relative">
			<section className="flex-1 flex flex-col items-center">
				{screenType !== 'desktop' &&
					<PWAInstallPrompt />
				}
				
				<div className="flex-grow flex flex-col items-stretch justify-center px-6 py-8 pb-16 max-w-lg w-full">
					<Logo aClassName='mb-10' imgClassName='w-10 h-10' />

					<h1 className="text-3xl mb-4 font-bold leading-tight tracking-tight text-c-lm-gray-900 dark:text-c-dm-gray-100">
						{t('loginSignup.welcomeMessage')}
					</h1>
					
					<p className="text-md mb-10 leading-tight tracking-tight text-c-lm-gray-700 dark:text-c-dm-gray-300">
						<Trans
							i18nKey="loginSignup.welcomeMessageDescription"
							components={{
								br: <br />
							}}
						/>
					</p>

					{children}
				</div>

				<footer className="py-5 absolute bottom-0 w-full">
					{screenType === 'desktop' &&
						<PWAInstallPrompt />
					}

					<div className="flex flex-row items-center justify-center text-c-lm-gray-700 dark:text-c-dm-gray-300 text-sm">
						<p>
							<Trans
								i18nKey="sidebar.poweredBy"
								components={{
									docLinkWalletGithub: (
										<a
											href="https://github.com/wwWallet"
											rel="noreferrer"
											target="_blank"
											aria-label={t('sidebar.poweredbyAriaLabel')}
										/>
									),
									docBtn: (
										<Button
											variant="link"
										/>
									)
								}}
							/>
						</p>

						<p className='mx-2'>
							•
						</p>

						<LanguageSelector 
							verticalPosition='top'
							horizontalPosition='center'
							renderLanguageSelector={(selectedLanguage, isOpen, setIsOpen) => (
								<p 
									className="cursor-pointer hover:text-c-lm-gray-900 dark:hover:text-c-dm-gray-100 data-[open=true]:text-c-lm-gray-900 dark:data-[open=true]:text-c-dm-gray-100 transition-all duration-200"
									onClick={() => setIsOpen(!isOpen)}
									aria-haspopup="listbox"
									data-open={isOpen}
									aria-expanded={isOpen}
								>
									<FontAwesomeIcon icon={faGlobe} className='mr-2' />
									
									{selectedLanguage.name}
								</p>
							)}
						/>

						<p className='mx-2'>
							•
						</p>

						<ThemeSelector
							verticalPosition='top'
							horizontalPosition='center'
							renderThemeSelector={(selectedTheme, isOpen, setIsOpen) => (
								<p 
									className="cursor-pointer hover:text-c-lm-gray-900 dark:hover:text-c-dm-gray-100 data-[open=true]:text-c-lm-gray-900 dark:data-[open=true]:text-c-dm-gray-100 transition-all duration-200"
									onClick={() => setIsOpen(!isOpen)}
									aria-haspopup="listbox"
									data-open={isOpen}
									aria-expanded={isOpen}
								>
									<FontAwesomeIcon icon={faMoon} className='mr-2' />
									
									{selectedTheme.value === 'system' ?
											window.matchMedia('(prefers-color-scheme: dark)').matches ? 
												'Dark mode'
											: 
												'Light mode'
										: 
											`${selectedTheme.label} mode`
									}
								</p>
							)}
						/>
					</div>

					<p className="hidden">v{config.APP_VERSION}</p>
				</footer>
			</section>
			
			<a 
				href="https://github.com/wwWallet" 
				target="_blank" 
				rel="noreferrer" 
				className='flex-1 flex flex-col items-stretch justify-stretch hidden md:flex'
			>
				<div className='group cursor-pointer relative flex-1 bg-c-lm-gray-200 dark:bg-c-dm-gray-800 mr-2 my-2 rounded-lg overflow-hidden'>
					<img 
					src="/city-lights-small.webp" 
					alt="wwWallet Welcome Image" 
					className='absolute top-0 left-0 w-full h-full object-cover object-center group-hover:scale-105 group-hover:opacity-80 transition-all duration-300 ease-out' 
					/>

					<div className='absolute bottom-0 w-full'>
						<div className='mx-4 my-4 flex items-center justify-between'>
							<p className='text-c-lm-gray-100 text-lg opacity-80 mr-8 group-hover:opacity-100 transition-all duration-300 ease-out shadow-lg'>
								We’re making the internet safer for everyone. Read more.
							</p>
							
							<AnimatedArrow
								lineClassName='bg-c-lm-gray-100'
								chevronClassName='text-c-lm-gray-100'
								className='opacity-80 group-hover:opacity-100 transition-all duration-300 ease-out'
								size='large'
								direction='right'
								customMargin={'-8px'}
							/>
						</div>
					</div>
				</div>
			</a>
		</section>
	);
}
