import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [credentials, setCredentials] = useState({
    login: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validCredentials = [
    { login: 'nevlaadislava', password: 'pass1' },
    { login: 'sunnlxx', password: 'pass2' },
    { login: 'dimka', password: 'pass3' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const isValid = validCredentials.some(
      cred => cred.login === credentials.login && cred.password === credentials.password
    );

    if (isValid) {
      navigate('/admin-panel');
    } else {
      setError('Неверный логин или пароль');
    }
  };

  const handleExit = () => {
    navigate('/'); // Переход на главную страницу регистрации
  };


  return (
    <div className="login-container">
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
          <button 
            type="button" 
            className="exit-btn"
            onClick={handleExit}
          >
            Вернуться к регистрации
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminLogin;