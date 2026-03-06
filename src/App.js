import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import './App.css';

const STORAGE_KEY = 'todo_app_data';

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Пытаемся получить данные пользователя (может не работать в локальной разработке)
        try {
          const user = await bridge.send('VKWebAppGetUserInfo');
          setUserInfo(user);
        } catch (userError) {
          console.log('Could not get user info (normal in development)');
          // Устанавливаем тестового пользователя для разработки
          setUserInfo({
            first_name: 'Тестовый',
            last_name: 'Пользователь',
            photo_100: 'https://vk.com/images/camera_100.png'
          });
        }

        // Загружаем задачи
        let savedTasks = [];
        
        // Пробуем загрузить из VK Storage
        try {
          const storageData = await bridge.send('VKWebAppStorageGet', {
            keys: [STORAGE_KEY]
          });
          
          if (storageData.keys && storageData.keys[0] && storageData.keys[0].value) {
            savedTasks = JSON.parse(storageData.keys[0].value);
          }
        } catch (storageError) {
          console.log('Could not load from VK Storage, trying localStorage');
          // Если не удалось загрузить из VK Storage, пробуем localStorage
          const localData = localStorage.getItem(STORAGE_KEY);
          if (localData) {
            savedTasks = JSON.parse(localData);
          }
        }

        setTasks(savedTasks);
      } catch (error) {
        console.error('Error initializing app:', error);
        setError('Произошла ошибка при загрузке приложения');
        
        // Пробуем загрузить из localStorage как последнюю надежду
        try {
          const localData = localStorage.getItem(STORAGE_KEY);
          if (localData) {
            setTasks(JSON.parse(localData));
          }
        } catch (e) {
          console.error('Could not load from localStorage either');
        }
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  const saveTasks = async (updatedTasks) => {
    try {
      // Сохраняем в localStorage всегда (для надежности)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
      
      // Пытаемся сохранить в VK Storage
      try {
        await bridge.send('VKWebAppStorageSet', {
          key: STORAGE_KEY,
          value: JSON.stringify(updatedTasks)
        });
      } catch (vkError) {
        console.log('Could not save to VK Storage, but saved to localStorage');
      }
    } catch (error) {
      console.error('Error saving tasks:', error);
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

    const updatedTasks = [...tasks, newTaskObj];
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    setNewTask('');
  };

  const deleteTask = async (id) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const toggleTask = async (id) => {
    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) {
      deleteTask(id);
      return;
    }

    const updatedTasks = tasks.map(task =>
      task.id === id ? { ...task, text: editText.trim() } : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    setEditingId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const clearCompleted = async () => {
    const updatedTasks = tasks.filter(task => !task.completed);
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Мой список дел</h1>
        {userInfo && (
          <div className="user-info">
            <img 
              src={userInfo.photo_100} 
              alt={`${userInfo.first_name} ${userInfo.last_name}`}
              className="user-avatar"
              onError={(e) => {
                e.target.src = 'https://vk.com/images/camera_100.png';
              }}
            />
            <span className="user-name">
              {userInfo.first_name} {userInfo.last_name}
            </span>
          </div>
        )}
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
                        aria-label="Сохранить"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="cancel-button"
                        aria-label="Отмена"
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
                        aria-label={`Отметить задачу "${task.text}" как ${task.completed ? 'невыполненную' : 'выполненную'}`}
                      />
                      <span
                        className="task-text"
                        onDoubleClick={() => startEdit(task)}
                        title="Двойной клик для редактирования"
                      >
                        {task.text}
                      </span>
                    </div>
                    <div className="task-actions">
                      <button
                        onClick={() => startEdit(task)}
                        className="edit-button"
                        title="Редактировать"
                        aria-label="Редактировать"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="delete-button"
                        title="Удалить"
                        aria-label="Удалить"
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
      </footer>
    </div>
  );
};

export default App;