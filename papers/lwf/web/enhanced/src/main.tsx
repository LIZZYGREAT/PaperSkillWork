import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/components.css';
import './styles/paper.css';
import './styles/layout.css';
import './styles/alexnet.css';
import './styles/reference-hub.css';
import './styles/scene-j.css';
import './styles/workspace-curtain.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
