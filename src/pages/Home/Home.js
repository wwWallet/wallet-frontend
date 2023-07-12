import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove('loggedIn');
    navigate('/login');
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-8">Welcome to the Home Page!</h2>
        <p>This is the content of your home page.</p>
        <p>You can add any desired content or components here.</p>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4"
          type="button"
        >
          Logout
        </button>
        <p className="mt-4">
          Not logged in? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Home;
