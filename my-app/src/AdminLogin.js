// AdminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [credentials, setCredentials] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [userType, setUserType] = useState('admin');

  // УДАЛЯЕМ ЭТОТ МАССИВ - он больше не нужен
  // const validCredentials = [ ... ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  // ИЗМЕНЯЕМ ФУНКЦИЮ ОБРАБОТКИ ОТПРАВКИ ФОРМЫ
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Сбрасываем предыдущие ошибки

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        // Если статус ответа 2xx (успех)
        navigate('/admin-panel');
      } else {
        // Если сервер вернул ошибку (например, 401)
        const errorData = await response.json();
        setError(errorData.detail || 'Произошла ошибка входа');
      }
    } catch (err) {
      // Если произошла сетевая ошибка (сервер недоступен)
      console.error('Login fetch error:', err);
      setError('Ошибка подключения к серверу. Попробуйте позже.');
    }
  };

  const handleExit = () => {
    navigate('/'); // Переход на главную страницу регистрации
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    if (type === 'user') {
      navigate('/');
    }
  };

  return (
    <div className="login-container">
      <div className="user-type-selector">
        <button
          className={`user-type-btn ${userType === 'user' ? 'active' : ''}`}
          onClick={() => handleUserTypeChange('user')}
          type="button"
        >
          Пользователь
        </button>
        <button
          className={`user-type-btn ${userType === 'admin' ? 'active' : ''}`}
          onClick={() => handleUserTypeChange('admin')}
          type="button"
        >
          Администратор
        </button>
      </div>
      <h1>Вход для администратора</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Логин:</label>
          <input
            type="text"
            name="login"
            value={credentials.login}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Пароль:</label>
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="button-group">
          <button type="submit" className="submit-btn">Войти</button>
        </div>
      </form>
    </div>
  );
}

export default AdminLogin;
