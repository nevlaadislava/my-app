

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css'; 

function AdminPage() {
  const [pendingActivities, setPendingActivities] = useState([]);
  const [approvedActivities, setApprovedActivities] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    setUserRole(role);

    const fetchActivities = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/activities');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setPendingActivities(data.filter(a => a.status === "pending"));
        setApprovedActivities(data.filter(a => a.status === "approved"));
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      }
    };

    const fetchRegistrationRequests = async () => {
      if (role === 'main_admin') {
        try {
          const response = await fetch('http://localhost:8000/api/admin/requests');
          if (!response.ok) throw new Error('Failed to fetch registration requests');
          const data = await response.json();
          setRegistrationRequests(data);
        } catch (error) {
          console.error('Ошибка при загрузке заявок на регистрацию:', error);
        }
      }
    };
    
    fetchActivities();
    fetchRegistrationRequests();
  }, [navigate]); 

  const handleApprove = async (activity) => {
    try {
      await fetch(`http://localhost:8000/api/activities/${activity.id}/approve`, {
        method: 'PUT',
      });
      setPendingActivities(prev => prev.filter(a => a.id !== activity.id));
      setApprovedActivities(prev => [...prev, {...activity, status: "approved"}]);
    } catch (error) {
      console.error('Ошибка при одобрении заявки:', error);
    }
  };

  const handleReject = async (activity) => {
    try {
      await fetch(`http://localhost:8000/api/activities/${activity.id}`, {
        method: 'DELETE',
      });
      setPendingActivities(prev => prev.filter(a => a.id !== activity.id));
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
    }
  };
  
  const handleDeleteApproved = async (activity) => {
    if (!window.confirm(`Вы уверены, что хотите удалить заявку от ${activity.full_name}? Это действие нельзя отменить.`)) return;
    try {
      await fetch(`http://localhost:8000/api/activities/${activity.id}`, {
        method: 'DELETE',
      });
      setApprovedActivities(prev => prev.filter(a => a.id !== activity.id));
    } catch (error) {
      console.error('Ошибка при удалении одобренной заявки:', error);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/activities/download');
      if (!response.ok) throw new Error('Ошибка при экспорте данных');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.style.display = 'none';
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при экспорте в Excel:', error);
      alert('Произошла ошибка при экспорте данных');
    }
  };
  
  const handleExportSingle = async (activity) => {
    try {
      const response = await fetch(`http://localhost:8000/api/activities/${activity.id}/download`);
      if (!response.ok) throw new Error(`Ошибка при выгрузке заявки ID ${activity.id}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_${activity.full_name.replace(/\s/g, '_')}_${activity.id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.style.display = 'none';
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при выгрузке одной заявки:', error);
      alert('Не удалось выгрузить заявку. ' + error.message);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userRole');
    navigate('/');
  };

  const handleApproveRegistration = async (userId) => {
    try {
      await fetch(`http://localhost:8000/api/admin/requests/${userId}/approve`, { method: 'PUT' });
      setRegistrationRequests(prev => prev.filter(req => req.id !== userId));
      alert('Пользователь одобрен!');
    } catch (error) {
      console.error('Ошибка при одобрении регистрации:', error);
    }
  };

  const handleOpenFile = (activity) => {
  if (!activity.file_name) return;
  
  const fileUrl = `http://localhost:8000/uploads/${activity.file_name}`;
  window.open(fileUrl, '_blank');
};
  
  const handleRejectRegistration = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите отклонить эту заявку?')) return;
    try {
      await fetch(`http://localhost:8000/api/admin/requests/${userId}/reject`, { method: 'DELETE' });
      setRegistrationRequests(prev => prev.filter(req => req.id !== userId));
      alert('Заявка отклонена.');
    } catch (error) {
      console.error('Ошибка при отклонении регистрации:', error);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <h1>Панель администратора</h1>
        {userRole === 'main_admin' && <span className="main-admin-badge">Главный администратор</span>}
      </div>

      {userRole === 'main_admin' && (
        <div className="registration-requests">
          <h2>Заявки на регистрацию</h2>
          {registrationRequests.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Логин</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {registrationRequests.map((req) => (
                  <tr key={`reg-${req.id}`}>
                    <td>{req.login}</td>
                    <td>{req.status}</td>
                    <td>
                      <button onClick={() => handleApproveRegistration(req.id)} className="approve-btn">
                        Одобрить
                      </button>
                      <button onClick={() => handleRejectRegistration(req.id)} className="reject-btn">
                        Отклонить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Нет новых заявок на регистрацию.</p>
          )}
        </div>
      )}

      <div className="button-group">
        <button onClick={handleExportExcel} className="export-btn">
          Экспорт всех заявок в Excel
        </button>
      </div>

      <div className="activities-sections">
        <div className="pending-activities">
          <h2>Заявки на рассмотрении</h2>
          {pendingActivities.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ФИО</th><th>Группа</th><th>Руководитель</th><th>Активность</th><th>Уровень</th><th>Фото</th><th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {pendingActivities.map((activity) => (
      <tr key={`рассмотрение-${activity.id}`}>
        <td>{activity.full_name}</td>
        <td>{activity.group_name}</td>
        <td>{activity.supervisor}</td>
        <td>{activity.activity}</td>
        <td>{activity.event_level}</td>
        <td>
          {activity.file_name && (
            activity.file_name.toLowerCase().endsWith('.pdf') ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img 
                  src="/pdf-icon.png" 
                  alt="PDF файл"
                  width="30"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleOpenFile(activity)}
                />
                <button 
                  onClick={() => handleOpenFile(activity)}
                  className="view-btn"
                >
                  Открыть
                </button>
              </div>
            ) : (
              <img 
                src={`http://localhost:8000/uploads/${activity.file_name}`} 
                alt="Достижение" 
                width="100"
                style={{ cursor: 'pointer' }}
                onClick={() => handleOpenFile(activity)}
              />
            )
          )}
        </td>
        <td>
          <button onClick={() => handleApprove(activity)} className="approve-btn">Принять</button>
          <button onClick={() => handleReject(activity)} className="reject-btn">Отклонить</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
          ) : (<p>Нет заявок на рассмотрении</p>)}
        </div>

        <div className="approved-activities">
          <h2>Принятые заявки</h2>
          {approvedActivities.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ФИО</th><th>Группа</th><th>Руководитель</th><th>Активность</th><th>Уровень</th><th>Фото</th><th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {approvedActivities.map((activity) => (
      <tr key={`принято-${activity.id}`}>
        <td>{activity.full_name}</td>
        <td>{activity.group_name}</td>
        <td>{activity.supervisor}</td>
        <td>{activity.activity}</td>
        <td>{activity.event_level}</td>
        <td>
          {activity.file_name && (
            activity.file_name.toLowerCase().endsWith('.pdf') ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img 
                  src="/pdf-icon.png"
                  alt="PDF файл"
                  width="30"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleOpenFile(activity)}
                />
                <button 
                  onClick={() => handleOpenFile(activity)}
                  className="view-btn"
                >
                  Открыть
                </button>
              </div>
            ) : (
              <img 
                src={`http://localhost:8000/uploads/${activity.file_name}`} 
                alt="Достижение" 
                width="100"
                style={{ cursor: 'pointer' }}
                onClick={() => handleOpenFile(activity)}
              />
            )
          )}
        </td>
        <td className="action-buttons">
          <button onClick={() => handleExportSingle(activity)} className="export-btn-single">Выгрузить</button>
          <button onClick={() => handleDeleteApproved(activity)} className="reject-btn">Удалить</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
          ) : (<p>Нет принятых заявок</p>)}
        </div>

        <button onClick={handleLogout} className="logout-btn">
          Выйти
        </button>
      </div>
    </div>
  );
}

export default AdminPage;