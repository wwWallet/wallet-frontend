import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import Issuers from './pages/Issuers/Issuers';
import History from './pages/History/History';

import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
					<Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
					<Route path="/issuers" element={<PrivateRoute><Issuers /></PrivateRoute>} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;
