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
    event_level: 'внутривузовская',
    organizer: '', 
    location: '', 
    dates: '',     
    photo: null
  });
  const [errors, setErrors] = useState({});
  const [userType, setUserType] = useState('user');
  const navigate = useNavigate();
  
  const validateNameField = (value, fieldName) => {
    const regex = /^[a-zA-Zа-яА-ЯёЁ\s\-']+$/;
    if (!value.trim()) {
      setErrors(prev => ({...prev, [fieldName]: 'Поле обязательно для заполнения'}));
      return false;
    }
    if (!regex.test(value)) {
      setErrors(prev => ({...prev, [fieldName]: 'Допустимы только буквы и символы -'}));
      return false;
    }
    setErrors(prev => ({...prev, [fieldName]: ''}));
    return true;
  };

  const validateGroup = (value) => {
    const regex = /^[a-zA-Zа-яА-ЯёЁ0-9\-\s]+$/;
    if (!value.trim()) {
      setErrors(prev => ({...prev, group: 'Поле обязательно для заполнения'}));
      return false;
    }
    if (!regex.test(value)) {
      setErrors(prev => ({...prev, group: 'Допустимы только буквы, цифры и символ -'}));
      return false;
    }
    setErrors(prev => ({...prev, group: ''}));
    return true;
  };

  const validateActivity = (value) => {
    const regex = /^[a-zA-Zа-яА-ЯёЁ0-9\s\-.,:;'"()!?]+$/;
    if (!value.trim()) {
      setErrors(prev => ({...prev, activity: 'Поле обязательно для заполнения'}));
      return false;
    }
    if (!regex.test(value)) {
      setErrors(prev => ({...prev, activity: 'Недопустимые символы в названии'}));
      return false;
    }
    setErrors(prev => ({...prev, activity: ''}));
    return true;
  };

  const validateOrganizer = (value) => {
    const regex = /^[a-zA-Zа-яА-ЯёЁ0-9\s\-.,:;'"()]+$/;
    if (!value.trim()) {
      setErrors(prev => ({...prev, organizer: 'Поле обязательно для заполнения'}));
      return false;
    }
    if (!regex.test(value)) {
      setErrors(prev => ({...prev, organizer: 'Недопустимые символы'}));
      return false;
    }
    setErrors(prev => ({...prev, organizer: ''}));
    return true;
  };

  const validateLocation = (value) => {
    const regex = /^[a-zA-Zа-яА-ЯёЁ0-9\s\-.,:;'"()/]+$/;
    if (!value.trim()) {
      setErrors(prev => ({...prev, location: 'Поле обязательно для заполнения'}));
      return false;
    }
    if (!regex.test(value)) {
      setErrors(prev => ({...prev, location: 'Недопустимые символы'}));
      return false;
    }
    setErrors(prev => ({...prev, location: ''}));
    return true;
  };

  const validateDate = (value) => {
    const regex = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.\d{4}$/;
    if (!value.trim()) {
      setErrors(prev => ({...prev, dates: 'Поле обязательно для заполнения'}));
      return false;
    }
    if (!regex.test(value)) {
      setErrors(prev => ({...prev, dates: 'Введите дату в формате дд.мм.гггг'}));
      return false;
    }
    
    const parts = value.split('.');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      setErrors(prev => ({...prev, dates: 'Введите корректную дату'}));
      return false;
    }
    
    setErrors(prev => ({...prev, dates: ''}));
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    switch(name) {
      case 'firstname':
      case 'secondname':
      case 'patronymic':
      case 'supervisor':
        validateNameField(value, name);
        break;
      case 'group':
        validateGroup(value);
        break;
      case 'activity':
        validateActivity(value);
        break;
      case 'organizer':
        validateOrganizer(value);
        break;
      case 'location':
        validateLocation(value);
        break;
      case 'dates':
        validateDate(value);
        break;
      default:
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    alert('Пожалуйста, загрузите файл в формате JPEG, PNG или PDF');
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
    
    const isFirstNameValid = validateNameField(formData.firstname, 'firstname');
    const isSecondNameValid = validateNameField(formData.secondname, 'secondname');
    const isPatronymicValid = formData.patronymic ? validateNameField(formData.patronymic, 'patronymic') : true;
    const isGroupValid = validateGroup(formData.group);
    const isSupervisorValid = validateNameField(formData.supervisor, 'supervisor');
    const isActivityValid = validateActivity(formData.activity);
    const isOrganizerValid = validateOrganizer(formData.organizer);
    const isLocationValid = validateLocation(formData.location);
    const isDateValid = validateDate(formData.dates);
    
    if (!isFirstNameValid || !isSecondNameValid || !isPatronymicValid || 
        !isGroupValid || !isSupervisorValid || !isActivityValid ||
        !isOrganizerValid || !isLocationValid || !isDateValid) {
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('firstname', formData.firstname);
    formDataToSend.append('secondname', formData.secondname);
    formDataToSend.append('patronymic', formData.patronymic);
    formDataToSend.append('group', formData.group);
    formDataToSend.append('supervisor', formData.supervisor);
    formDataToSend.append('activity', formData.activity);
    formDataToSend.append('event_level', formData.event_level);
    formDataToSend.append('organizer', formData.organizer);
    formDataToSend.append('location', formData.location);
    formDataToSend.append('dates', formData.dates);
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
    
      setFormData({
        firstname: '',
        secondname: '',
        patronymic: '',
        group: '',
        supervisor: '',
        activity: '',
        event_level: 'внутривузовская',
        organizer: '', 
        location: '',  
        dates: '',     
        photo: null
      });
      document.querySelector('input[type="file"]').value = '';
      setErrors({});
    
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Произошла ошибка при отправке заявки');
    }

    
  };

  return (
    <div className="main-page-container">
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
      <div className="form-header">Регистрация</div>
      <form className="form-content" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Фамилия:</label>
          <input type="text" name="secondname" value={formData.secondname} onChange={handleChange} required />
          {errors.secondname && <span className="error-message">{errors.secondname}</span>}
        </div>
        <div className="form-row">
          <label>Имя:</label>
          <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} required />
          {errors.firstname && <span className="error-message">{errors.firstname}</span>}
        </div>
        <div className="form-row">
          <label>Отчество:</label>
          <input type="text" name="patronymic" value={formData.patronymic} onChange={handleChange} />
          {errors.patronymic && <span className="error-message">{errors.patronymic}</span>}
        </div>
        <div className="form-row">
          <label>Группа:</label>
          <input type="text" name="group" value={formData.group} onChange={handleChange} required />
          {errors.group && <span className="error-message">{errors.group}</span>}
        </div>
        <div className="form-row">
          <label>Руководитель:</label>
          <input type="text" name="supervisor" value={formData.supervisor} onChange={handleChange} required />
          {errors.supervisor && <span className="error-message">{errors.supervisor}</span>}
        </div>
        <div className="form-row">
          <label>Название активности:</label>
          <input type="text" name="activity" value={formData.activity} onChange={handleChange} required />
          {errors.activity && <span className="error-message">{errors.activity}</span>}
        </div>
        
        <div className="form-row">
          <label>Уровень мероприятия:</label>
          <select
            name="event_level"
            value={formData.event_level}
            onChange={handleChange}
            required
          >
            <option value="внутривузовская">Внутривузовская</option>
            <option value="городской">Городской</option>
            <option value="региональный">Региональный</option>
            <option value="всероссийский">Всероссийский</option>
            <option value="международный">Международный</option>
          </select>
        </div>
        
        <div className="form-row">
          <label>Организатор:</label>
          <input type="text" name="organizer" value={formData.organizer} onChange={handleChange} required />
          {errors.organizer && <span className="error-message">{errors.organizer}</span>}
        </div>
        <div className="form-row">
          <label>Место проведения:</label>
          <input type="text" name="location" value={formData.location} onChange={handleChange} required />
          {errors.location && <span className="error-message">{errors.location}</span>}
        </div>
        <div className="form-row">
          <label>Даты проведения:</label>
          <input 
            type="text" 
            name="dates" 
            value={formData.dates} 
            onChange={handleChange} 
            placeholder="дд.мм.гггг"
            required 
          />
          {errors.dates && <span className="error-message">{errors.dates}</span>}
        </div>

        <div className="form-row">
          <label>Файл достижения (JPEG, PNG или PDF):</label>
          <input 
            type="file" 
            name="photo" 
            onChange={handleFileChange} 
            accept="image/jpeg, image/png, application/pdf" 
            required
          />
        </div>
        
        <div className="form-row">
          <button type="submit">Отправить</button>
        </div>
      </form>
    </div>
  );
}

export default MainPage;