import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const [activities, setActivities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/activities');
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      }
    };
    
    fetchActivities();
  }, []);

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <h1>Панель администратора</h1>
        <button 
          onClick={handleLogout}
          className="logout-btn"
        >
          Выйти в меню регистрации
        </button>
      </div>

      <div className="activities-list">
        <h2>Зарегистрированные студенты</h2>
        {activities.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Группа</th>
                <th>Руководитель</th>
                <th>Активность</th>
                <th>Фото</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity, index) => (
                <tr key={index}>
                  <td>{activity.firstname} {activity.secondname} 
      {activity.patronymic && ` ${activity.patronymic}`}</td>
                  <td>{activity.group}</td>
                  <td>{activity.supervisor}</td>
                  <td>{activity.activity}</td>
                  <td>
                    {activity.photo_filename && (
                      <img 
                        src={`http://localhost:8000/uploads/${activity.photo_filename}`} 
                        alt="Студент" 
                        width="100"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Нет зарегистрированных студентов</p>
        )}
      </div>
    </div>
  );
}

export default AdminPage;