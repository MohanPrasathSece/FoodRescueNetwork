import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';

// Configure axios baseURL: prioritize REACT_APP_API_URL, else use CRA proxy in dev, else fallback to Railway
if (process.env.NODE_ENV === 'development') {
  // Dev: use proxy
  axios.defaults.baseURL = '';
} else if (process.env.REACT_APP_API_URL) {
  // Prod/Preview: use provided API URL
  axios.defaults.baseURL = process.env.REACT_APP_API_URL;
} else {
  // Fallback: Railway public URL
  axios.defaults.baseURL = 'https://backendfoodresq-production.up.railway.app';
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);