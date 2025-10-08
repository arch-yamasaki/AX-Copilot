
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initAuthPersistence } from './services/authService';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
initAuthPersistence()
  .catch(() => { /* noop: 初期化失敗時も描画は継続 */ })
  .finally(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
