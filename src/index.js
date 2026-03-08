import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import bridge from '@vkontakte/vk-bridge';

bridge.send('VKWebAppInit')
  .then(() => {
    console.log('✅ VK Bridge инициализирован');
    
    
    return bridge.send('VKWebAppUpdateConfig', {
      appearance: 'light'
    });
  })
  .then(() => {
    console.log('✅ Конфигурация отправлена');
  })
  .catch((error) => {
    console.log('❌ Ошибка инициализации VK Bridge:', error);
  });


bridge.subscribe(({ detail: { type, data } }) => {
  console.log('📡 Событие VK:', type, data);
  
  if (type === 'VKWebAppUpdateConfig') {
    
    if (data.appearance === 'dark') {
      document.body.classList.add('vk-dark-theme');
      document.body.classList.remove('vk-light-theme');
    } else {
      document.body.classList.add('vk-light-theme');
      document.body.classList.remove('vk-dark-theme');
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);