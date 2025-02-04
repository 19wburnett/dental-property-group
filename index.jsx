import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix the import path - remove 'src/'
import App from './src/App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);