import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ConsoleBehavior from './ConsoleBehavior';
import './index.css';

ConsoleBehavior();

const root = createRoot(document.getElementById('root'));
root.render(<App />);

