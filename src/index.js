import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import bridge from '@vkontakte/vk-bridge';

// Инициализация VK Bridge с обработкой ошибок
bridge.send('VKWebAppInit')
  .then(() => {
    console.log('VK Bridge initialized');
  })
  .catch((error) => {
    console.log('VK Bridge initialization failed (expected in development)');
  });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);