import React, { useState,useEffect } from 'react';
import Sidebar from './Sidebar';
import { GiHamburgerMenu } from 'react-icons/gi';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa'; // Import the icons you want to use
import logo from '../assets/images/wallet_white.png';
import { useLocation, useNavigate } from 'react-router-dom';

const Layout = ({ children, isPermissionGranted, isPermissionValue,setispermissionValue }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isContentVisible, setIsContentVisible] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [isMessageVisible, setIsMessageVisible] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleNavigate = (path) => {
    if (location.pathname === path) {
      window.location.reload();
    } else {
      navigate(path);
    }
  };

  const handleCloseMessage = () => {
    setIsMessageVisible(false);
    // Store the isMessageVisible state in session storage
    sessionStorage.setItem('isMessageVisible', 'false');
  };

  useEffect(() => {
    // Retrieve the isMessageVisible state from session storage
    const storedIsMessageVisible = sessionStorage.getItem('isMessageVisible');
    if (storedIsMessageVisible === 'false') {
      setIsMessageVisible(false);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('permission', permission);
			if (permission === 'granted') {
				window.location.reload();
			}else {
				setispermissionValue(permission);
			}
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setIsContentVisible(true);
    }, 0);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isOpen} toggle={toggleSidebar} />

      {/* Header */}
      <header
        className={`${isOpen ? 'hidden' : 'z-50 fixed top-0 left-0 w-full bg-custom-blue text-white flex items-center justify-between p-4 sm:hidden'}`}
      >
        <div className="flex items-center">
          <img
            src={logo}
            alt="Logo"
            className="w-10 h-auto mr-2 cursor-pointer"
            onClick={() => handleNavigate('/')}
          />
        </div>
        <h1
          className="text-white text-xl font-bold cursor-pointer"
          onClick={() => handleNavigate('/')}
        >
          wwWallet
        </h1>
        <button className="text-white" onClick={toggleSidebar}>
          <GiHamburgerMenu size={24} />
        </button>
      </header>

      <div className="w-3/5 flex flex-col flex-grow">
        {/* Sidebar */}
        <div
          className={`sticky top-0 h-screen overflow-y-auto bg-custom-blue text-white p-6 sm:w-64 ${
            isOpen ? 'block' : 'hidden'
          }`}
        >
          <Sidebar isOpen={isOpen} toggle={toggleSidebar} />
        </div>

        {/* Content */}
        <div className="flex-grow bg-gray-100 p-6 mt-10 pt-10 sm:mt-0 sm:pt-6 overflow-y-auto">
          {/* Conditional Notification Message */}
          {isPermissionGranted !== true && isMessageVisible && isPermissionValue && isPermissionValue!=='granted' && (
            <div className="bg-orange-100 shadow-lg p-4 rounded-lg mb-4 flex items-center">
              <div className="mr-4 text-orange-500">
                <FaExclamationTriangle size={24} />
              </div>
							<div className="flex-grow">
								{isPermissionValue === 'default' && (
									<>
										<p className='text-sm'>
											To receive real-time updates of{' '}
											<span className="font-semibold">Credentials</span>, please{' '}
											<span className="font-semibold">
												allow permission for notifications
											</span>{' '}
											from your browser.
											<a className="ml-2" onClick={requestNotificationPermission}>
												<button
												className="px-2 py-1 text-white bg-custom-blue hover:bg-custom-blue-hover font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover"
												onClick={requestNotificationPermission}
											>
												Allow
												</button>
											</a>
										</p>
									</>
								)}
								{isPermissionValue === 'denied' && (
									<>
										<p className='text-sm'>
											To receive real-time updates of{' '}
											<span className="font-semibold">Credentials</span>, please{' '}
											<span className="font-semibold">
												manual reset or allow permission for notifications
											</span>{' '}
											from your browser.
										</p>
									</>
								)}
							</div>
              <button
                className="ml-2 text-gray-800"
                onClick={handleCloseMessage}
              >
                <FaTimes size={24} />
              </button>
            </div>
          )}
          <div className={`fade-in-content ${isContentVisible ? 'visible' : ''}`}>
						{children}
					</div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
