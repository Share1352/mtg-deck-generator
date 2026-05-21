import React from '../vendor/react.js';
import { createRoot } from '../vendor/react-dom-client.js';
import App from './App.js';
createRoot(document.getElementById('root')).render(React.createElement(React.StrictMode, null, React.createElement(App)));
