
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './App.css'; 

function AdminRegister() {
  const [credentials, setCredentials] = useState({ login: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setCredentials({ login: '', password: '' }); // Очистить форму
      } else {
        setError(data.detail || 'Произошла ошибка регистрации');
      }
    } catch (err) {
      console.error('Registration fetch error:', err);
      setError('Ошибка подключения к серверу.');
    }
  };

  return (
    <div className="login-container">
      <h1>Регистрация администратора</h1>
      <p>Подайте заявку, и главный администратор рассмотрит ее.</p>
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
        {message && <div className="success-message">{message}</div>}
        <div className="button-group">
          <button type="submit" className="submit-btn">Подать заявку</button>
        </div>
      </form>
      <div className="link-to-register">
        Уже есть аккаунт? <Link to="/admin-login">Войти</Link>
      </div>
    </div>
  );
}

export default AdminRegister;