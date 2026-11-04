import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import all original stylesheets preserving 100% of the styles, responsiveness & animations
import './styles/style.css';
import './styles/mobile.css';
import './styles/form.css';
import './styles/custom-blouse.css';
import './styles/product-details.css';
import './styles/about.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
