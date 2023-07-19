import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';

import logo from '../../assets/images/ediplomasLogo.svg';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const walletBackendUrl = 'https://university-ebsi.ediplomas.gr/wallet';

const handleLogin = async (event) => {
  event.preventDefault();

  if (username === '' || password === '') {
    setError('Please fill in all required fields');
    return;
  }

  try {
    const response = await loginUser(username, password);
    const appToken = response.appToken;
    Cookies.set('loggedIn', true);
    Cookies.set('username', username);
    Cookies.set('appToken', appToken);
    navigate('/');
  } catch (error) {
    setError('Incorrect username or password');
  }
};

const handleSignup = async (event) => {
  event.preventDefault();

  if (username === '' || password === '' || confirmPassword === '') {
    setError('Please fill in all required fields');
    return;
  }

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  try {
    const response = await signupUser(username, password);
    const appToken = response.appToken;
    Cookies.set('loggedIn', true);
    Cookies.set('username', username);
    Cookies.set('appToken', appToken);
    navigate('/');
  } catch (error) {
    setError('Failed to create user account, username already exists');
  }
};

  const loginUser = async (username, password) => {
    try {
      const response = await axios.post(`${walletBackendUrl}/user/login`, {
        username,
        password,
      });

      // Handle the response as needed
			console.log(response.data);
      return response.data;

    } catch (error) {
      console.error('Failed to log in user', error);
      throw error;
    }
  };

  const signupUser = async (username, password) => {
    try {
      const response = await axios.post(`${walletBackendUrl}/user/register`, {
        username,
        password,
      });

      // Handle the response as needed
			console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to sign up user, the username already exists', error);
      throw error;
    }
  };


  return (
    <section className="bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto h-screen pb-20">
        <a href="/" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
          <img className="w-20" src={logo} alt="logo" />
        </a>
        <h1 className="text-xl mb-7 font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
          Welcome to eDiplomas <br></br> Digital Wallet
        </h1>
        <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
              {isLogin ? 'Login' : 'Sign Up'}
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={isLogin ? handleLogin : handleSignup}>
              {error && <p className="text-red-500">{error}</p>}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                  Username
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {!isLogin && (
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
                    Confirm Password
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}

              <button
                className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                type="submit"
              >
                {isLogin ? 'Login' : 'Sign Up'}
              </button>
              <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                {isLogin ? 'New here? ' : 'Already have an account? '}
                <a
                  href="/"
                  className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLogin(!isLogin);
                  }}
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
