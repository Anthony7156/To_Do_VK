import React, { useState, useEffect } from 'react';
import './App.css';

const STORAGE_KEY = 'todo_app_data';

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [filter, setFilter] = useState('all');

  
  useEffect(() => {
    console.log('Loading tasks from localStorage...');
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
        console.log('Tasks loaded:', JSON.parse(savedTasks));
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
        console.log('Demo tasks created');
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, []);

  
  useEffect(() => {
    if (tasks.length > 0) {
      console.log('Saving tasks to localStorage:', tasks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  const addTask = (e) => {
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
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
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

  const clearCompleted = () => {
    setTasks(tasks.filter(task => !task.completed));
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
    <div className="app">
      <header className="app-header">
        <h1>Мой список дел</h1>
        <div className="user-info">
          <img 
            src="https://vk.com/images/camera_100.png" 
            alt="Пользователь"
            className="user-avatar"
          />
          <span className="user-name">
            Тестовый пользователь
          </span>
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
      </footer>
    </div>
  );
};

export default App;