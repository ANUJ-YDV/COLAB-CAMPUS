import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode disabled due to incompatibility with react-beautiful-dnd
  // See: https://github.com/atlassian/react-beautiful-dnd/issues/2399
  <App />
);
