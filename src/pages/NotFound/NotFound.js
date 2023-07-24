import React from 'react';
import logo from '../../assets/images/ediplomasLogo.svg';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };
	return(
	<section className="bg-gray-100 dark:bg-gray-900">
	<div className="flex flex-col items-center justify-center px-6 py-8 mx-auto h-screen pb-20">
		<a href="/" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
			<img className="w-20" src={logo} alt="logo" />
		</a>
		<h1 className="text-xl mb-7 font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
			eDiplomas Digital Wallet
		</h1>
		<div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
			<div className="p-6 space-y-4 md:space-y-6 sm:p-8">
				<h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl text-center dark:text-white">
					Oops, page not found!
				</h1>

				<p className='text-center'>Sorry, the page you're looking for cannot be accessed</p>
        <button
          onClick={handleBackToHome}
          className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Back to Home
        </button>
			</div>
		</div>
	</div>
</section>
	);
};

export default NotFound;
