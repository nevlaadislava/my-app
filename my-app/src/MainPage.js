import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function MainPage() {
  const [formData, setFormData] = useState({
    firstname: '',
    secondname: '',
    patronymic: '',
    group: '',
    supervisor: '',
    activity: '',
    photo: null
  });
  const [userType, setUserType] = useState('user');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Пожалуйста, загрузите изображение в формате JPEG или PNG');
      return;
    }
    setFormData(prev => ({
      ...prev,
      photo: file
    }));
  }
};

  const handleUserTypeChange = (type) => {
    setUserType(type);
    if (type === 'admin') {
      navigate('/admin-login');
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const formDataToSend = new FormData();
  formDataToSend.append('firstname', formData.firstname);
  formDataToSend.append('secondname', formData.secondname);
  formDataToSend.append('patronymic', formData.patronymic);
  formDataToSend.append('group', formData.group);
  formDataToSend.append('supervisor', formData.supervisor);
  formDataToSend.append('activity', formData.activity);
  formDataToSend.append('photo', formData.photo);

  try {
    const response = await fetch('http://localhost:8000/api/activities', {
      method: 'POST',
      body: formDataToSend,
    });
    
    if (!response.ok) {
      throw new Error('Ошибка сервера');
    }
    
    const data = await response.json();
    alert('Заявка успешно отправлена!');
    
    // Сброс формы после успешной отправки
    setFormData({
      firstname: '',
      secondname: '',
      patronymic: '',
      group: '',
      supervisor: '',
      activity: '',
      photo: null
    });
    document.querySelector('input[type="file"]').value = '';
    
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Произошла ошибка при отправке заявки');
  }
};
  return (
    <div className="main-page-container">
      <div className="form-header">Регистрация</div>
      <form className="form-content" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Фамилия:</label>
          <input
            type="text"
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <label>Имя:</label>
          <input
            type="text"
            name="secondname"
            value={formData.secondname}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <label>Отчество:</label>
          <input
            type="text"
            name="patronymic"
            value={formData.patronymic}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-row">
          <label>Группа:</label>
          <input
            type="text"
            name="group"
            value={formData.group}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-row">
          <label>Руководитель:</label>
          <input
            type="text"
            name="supervisor"
            value={formData.supervisor}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <label>Активность:</label>
          <input
            type="text"
            name="activity"
            value={formData.activity}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-row">
          <label>Изображение достижения:</label>
          <input
            type="file"
            name="photo"
            onChange={handleFileChange}
            accept="image/*"
          />
        </div>
        
        <div className="form-row">
          <button type="submit">Зарегистрироваться</button>

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
        </div>
      </form>
    </div>
  );
}


export default MainPage;