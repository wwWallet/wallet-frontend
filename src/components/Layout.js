import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { GiHamburgerMenu } from 'react-icons/gi';
import logo from '../assets/images/ediplomasLogo.svg';

const Layout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="flex h-screen">
      <Sidebar isOpen={isOpen} toggle={toggleSidebar} />

      {/* Header */}
      <header className={`${isOpen ? 'hidden' : 'z-50 fixed top-0 left-0 w-full bg-custom-blue text-white flex items-center justify-between p-4 sm:hidden'}`}>
        <div className="flex items-center">
          <img src={logo} alt="Logo" className="w-8 h-auto mr-2" />
          <h1 className="text-white text-lg font-bold">eDiplomas Digital Wallet</h1>
        </div>
        <button className="text-white" onClick={toggleSidebar}>
          <GiHamburgerMenu size={24} />
        </button>
      </header>
      
      <div className="flex flex-col flex-grow">
        {/* Sidebar */}
        <div className={`sticky top-0 h-screen overflow-y-auto bg-custom-blue text-white p-6 sm:w-64 ${isOpen ? 'block' : 'hidden'}`}>
          <Sidebar isOpen={isOpen} toggle={toggleSidebar} />
        </div>

        {/* Content */}
        <div className="flex-grow bg-gray-100 p-6 mt-10 pt-10 sm:mt-0 sm:pt-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
