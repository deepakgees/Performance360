import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

/**
 * Application Entry Point
 *
 * This file serves as the main entry point for the React application.
 * It initializes the React root and renders the main App component.
 *
 * The root element is expected to have the ID 'root' in the public/index.html file.
 * React.StrictMode is enabled for development-time checks and warnings.
 */

// Create the root element for React 18's concurrent features
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the application with StrictMode for development checks
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
