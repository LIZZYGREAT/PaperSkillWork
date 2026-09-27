import React from 'react';
import ReactDOM from 'react-dom/client';

const useVerticalSlice = new URLSearchParams(window.location.search).get('version') === 'v3';
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

if (useVerticalSlice) {
  void import('./v3/LwfVerticalSlice').then(({ default: LwfVerticalSlice }) => {
    root.render(<React.StrictMode><LwfVerticalSlice /></React.StrictMode>);
  });
} else {
  void Promise.all([
    import('./styles/tokens.css'),
    import('./styles/components.css'),
    import('./styles/paper.css'),
    import('./styles/layout.css'),
    import('./styles/alexnet.css'),
    import('./styles/reference-hub.css'),
    import('./styles/scene-j.css'),
    import('./styles/workspace-curtain.css'),
    import('./App'),
  ]).then(([, , , , , , , , { default: App }]) => {
    root.render(<React.StrictMode><App /></React.StrictMode>);
  });
}
