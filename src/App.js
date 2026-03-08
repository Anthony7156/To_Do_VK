import React, { useState, useEffect } from 'react';
import './App.css';
import bridge from '@vkontakte/vk-bridge';

const STORAGE_KEY = 'todo_app_data';

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [filter, setFilter] = useState('all');
  
  
  const [vkUser, setVkUser] = useState(null);
  const [vkPlatform, setVkPlatform] = useState('');
  const [vkLaunchParams, setVkLaunchParams] = useState({});
  const [vkInitialized, setVkInitialized] = useState(false);
  const [vkTheme, setVkTheme] = useState('light');


  useEffect(() => {
    const initializeVK = async () => {
      try {
        
        const launchParams = await bridge.send('VKWebAppGetLaunchParams');
        console.log('📱 Параметры запуска:', launchParams);
        setVkLaunchParams(launchParams);

        
        const clientInfo = await bridge.send('VKWebAppGetClientVersion');
        console.log('📱 Платформа:', clientInfo);
        setVkPlatform(clientInfo.platform);

        
        const userData = await bridge.send('VKWebAppCallAPIMethod', {
          method: 'users.get',
          params: {
            fields: 'photo_100, city, country',
            v: '5.131'
          }
        });
        
        if (userData.response && userData.response[0]) {
          setVkUser(userData.response[0]);
        }

        
        bridge.subscribe(({ detail: { type, data } }) => {
          if (type === 'VKWebAppUpdateConfig') {
            console.log('🎨 Тема обновлена:', data.appearance);
            setVkTheme(data.appearance || 'light');
          }
        });

        setVkInitialized(true);
      } catch (error) {
        console.error('❌ Ошибка получения данных VK:', error);
        // Если не удалось получить данные VK, используем тестовые данные
        setVkInitialized(true);
      }
    };

    initializeVK();
  }, []);

  
  useEffect(() => {
    console.log('💾 Загрузка задач из localStorage...');
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
        console.log('✅ Задачи загружены:', JSON.parse(savedTasks));
        
        
        if (vkInitialized) {
          bridge.send('VKWebAppShowSnackbar', {
            text: '✅ Задачи загружены',
            duration: 2000
          }).catch(() => {});
        }
      } else {
        
        const demoTasks = [
          {
            id: 1,
            text: 'Купить продукты',
            completed: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            text: 'Сделать зарядку',
            completed: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            text: 'Почитать книгу',
            completed: false,
            createdAt: new Date().toISOString()
          }
        ];
        setTasks(demoTasks);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(demoTasks));
        console.log('📝 Демо-задачи созданы');
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки задач:', error);
    }
  }, [vkInitialized]);

  
  useEffect(() => {
    if (tasks.length > 0) {
      console.log('💾 Сохранение задач:', tasks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);


  
  const shareTask = async (taskText) => {
    try {
      await bridge.send('VKWebAppShare', {
        link: window.location.href,
        message: `📝 Новая задача: ${taskText}`
      });
      console.log('✅ Задача опубликована');
    } catch (error) {
      console.error('❌ Ошибка публикации:', error);
    }
  };

  const showVKAlert = async (title, message) => {
    try {
      await bridge.send('VKWebAppShowAlert', {
        title: title,
        message: message
      });
    } catch (error) {
      console.error('❌ Ошибка показа алерта:', error);
    }
  };

  const showVKConfirm = async (message) => {
    try {
      const result = await bridge.send('VKWebAppShowConfirm', {
        message: message
      });
      return result.result; // true или false
    } catch (error) {
      console.error('❌ Ошибка подтверждения:', error);
      return false;
    }
  };

  const showVKStory = async () => {
    try {
      const taskStats = `Задачи: всего ${tasks.length}, выполнено ${tasks.filter(t => t.completed).length}`;
      
      await bridge.send('VKWebAppShowStory', {
        background_type: 'image',
        attachment: {
          type: 'text',
          text: taskStats
        }
      });
    } catch (error) {
      console.error('❌ Ошибка создания истории:', error);
    }
  };

  const addTaskToVKNotes = async (taskText) => {
    try {
      await bridge.send('VKWebAppAddToNotes', {
        text: taskText
      });
    } catch (error) {
      console.error('❌ Ошибка добавления в заметки:', error);
    }
  };


  
  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const newTaskObj = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    setTasks([...tasks, newTaskObj]);
    setNewTask('');

    try {
      await bridge.send('VKWebAppShowSnackbar', {
        text: '✅ Задача добавлена',
        duration: 1500
      });
    } catch (error) {
      console.log('Snackbar не поддерживается');
    }
  };

  const deleteTask = async (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    

    const confirmed = await showVKConfirm(`Удалить задачу "${taskToDelete.text}"?`);
    
    if (confirmed) {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = (id) => {
    if (!editText.trim()) {
      deleteTask(id);
      return;
    }

    setTasks(tasks.map(task =>
      task.id === id ? { ...task, text: editText.trim() } : task
    ));
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const clearCompleted = async () => {
    const completedCount = tasks.filter(t => t.completed).length;
    
    if (completedCount === 0) return;
    
    const confirmed = await showVKConfirm(`Удалить ${completedCount} выполненных задач?`);
    
    if (confirmed) {
      setTasks(tasks.filter(task => !task.completed));
    }
  };


  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;

  return (
    <div className={`app ${vkTheme === 'dark' ? 'dark-theme' : ''}`}>
      <header className="app-header">
        <h1>Мой список дел</h1>
        
        {/* VK User Info */}
        <div className="vk-user-info">
          {vkUser ? (
            <>
              <img 
                src={vkUser.photo_100 || 'https://vk.com/images/camera_100.png'} 
                alt={vkUser.first_name}
                className="user-avatar"
              />
              <div className="user-details">
                <span className="user-name">
                  {vkUser.first_name} {vkUser.last_name}
                </span>
                <span className="vk-platform">
                  {vkPlatform === 'mobile' ? '📱 Мобильная версия' : '💻 Веб-версия'}
                </span>
              </div>
            </>
          ) : (
            <div className="user-info-placeholder">
              <img 
                src="https://vk.com/images/camera_100.png" 
                alt="Пользователь"
                className="user-avatar"
              />
              <span className="user-name">Тестовый пользователь</span>
            </div>
          )}
          
          {/* Кнопки VK действий */}
          <div className="vk-actions">
            <button 
              onClick={() => showVKStory()} 
              className="vk-action-button"
              title="Поделиться в истории"
            >
              📱
            </button>
            <button 
              onClick={() => showVKAlert('О приложении', 'Todo-приложение с интеграцией VK Bridge')} 
              className="vk-action-button"
              title="Информация"
            >
              ℹ️
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <form className="add-task-form" onSubmit={addTask}>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Добавить новую задачу..."
            className="task-input"
          />
          <button type="submit" className="add-button">
            Добавить
          </button>
        </form>

        {tasks.length > 0 && (
          <div className="task-stats">
            <div className="stat-item">
              <span className="stat-label">Всего:</span>
              <span className="stat-value">{totalTasks}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Активных:</span>
              <span className="stat-value">{activeTasks}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Выполнено:</span>
              <span className="stat-value">{completedTasks}</span>
            </div>
          </div>
        )}

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Активные
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Выполненные
          </button>
        </div>

        <div className="tasks-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              {filter === 'all' && 'Список дел пуст. Добавьте первую задачу!'}
              {filter === 'active' && 'Нет активных задач'}
              {filter === 'completed' && 'Нет выполненных задач'}
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className={`task-item ${task.completed ? 'completed' : ''}`}
              >
                {editingId === task.id ? (
                  <div className="task-edit">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="edit-input"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(task.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <div className="edit-actions">
                      <button
                        onClick={() => saveEdit(task.id)}
                        className="save-button"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="cancel-button"
                      >
                        ✗
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="task-content">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="task-checkbox"
                      />
                      <span
                        className="task-text"
                        onDoubleClick={() => startEdit(task)}
                      >
                        {task.text}
                      </span>
                    </div>
                    <div className="task-actions">
                      <button
                        onClick={() => shareTask(task.text)}
                        className="share-button"
                        title="Поделиться"
                      >
                        📤
                      </button>
                      <button
                        onClick={() => addTaskToVKNotes(task.text)}
                        className="notes-button"
                        title="Добавить в заметки"
                      >
                        📝
                      </button>
                      <button
                        onClick={() => startEdit(task)}
                        className="edit-button"
                        title="Редактировать"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="delete-button"
                        title="Удалить"
                      >
                        ×
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {completedTasks > 0 && (
          <button onClick={clearCompleted} className="clear-button">
            Очистить выполненные
          </button>
        )}
      </main>

      <footer className="app-footer">
        <p>Двойной клик по задаче - редактирование</p>
        <p className="vk-bridge-status">
          {vkInitialized ? '✅ VK Bridge активен' : '⏳ Подключение к VK...'}
        </p>
      </footer>
    </div>
  );
};

export default App;