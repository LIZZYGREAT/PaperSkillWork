import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/components.css';
import './styles/paper.css';
import './styles/v2.css';
import './styles/reference-hub.css';
import './styles/scene-j.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
