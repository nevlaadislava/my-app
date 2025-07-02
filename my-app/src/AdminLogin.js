

import React, { useState } from 'react';

import { useNavigate, Link } from 'react-router-dom';

function AdminLogin() {
  const [credentials, setCredentials] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [userType, setUserType] = useState('admin');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {

        sessionStorage.setItem('userRole', data.role);
        navigate('/admin-panel');
      } else {
        setError(data.detail || 'Произошла ошибка входа');
      }
    } catch (err) {
      console.error('Login fetch error:', err);
      setError('Ошибка подключения к серверу. Попробуйте позже.');
    }
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
          <input type="text" name="login" value={credentials.login} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Пароль:</label>
          <input type="password" name="password" value={credentials.password} onChange={handleChange} required />
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="button-group">
          <button type="submit" className="submit-btn">Войти</button>
        </div>
      </form>

      <div className="link-to-register">
        Нет аккаунта? <Link to="/admin-register">Подать заявку на регистрацию</Link>
      </div>
    </div>
  );
}

export default AdminLogin;