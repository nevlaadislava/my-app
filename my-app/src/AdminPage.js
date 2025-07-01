import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';

function AdminPage() {
  const [pendingActivities, setPendingActivities] = useState([]);
  const [approvedActivities, setApprovedActivities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/activities');
        const data = await response.json();
        setPendingActivities(data.filter(a => a.status === "pending"));
        setApprovedActivities(data.filter(a => a.status === "approved"));
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      }
    };
    
    fetchActivities();
  }, []);

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

  const handleLogout = () => {
    navigate('/');
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/activities/download');
      if (!response.ok) {
        throw new Error('Ошибка при экспорте данных');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при экспорте в Excel:', error);
      alert('Произошла ошибка при экспорте данных');
    }
  };
  
  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <h1>Панель администратора</h1>
      </div>
      <div className="button-group">
  <button onClick={handleExportExcel} className="export-btn">
    Экспорт в Excel
  </button>
</div>
      <div className="activities-sections">
        <div className="pending-activities">
          <h2>Заявки на рассмотрении</h2>
          {pendingActivities.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ФИО</th>
                  <th>Группа</th>
                  <th>Руководитель</th>
                  <th>Активность</th>
                  <th>Фото</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {pendingActivities.map((activity) => (
                  <tr key={`pending-${activity.id}`}>
                    <td>{activity.full_name}</td>
                    <td>{activity.group_name}</td>
                    <td>{activity.supervisor}</td>
                    <td>{activity.activity}</td>
                    <td>
                      {activity.file_name && (
                        <img 
                          src={`http://localhost:8000/uploads/${activity.file_name}`} 
                          alt="Достижение" 
                          width="100"
                        />
                      )}
                    </td>
                    <td>
                      <button onClick={() => handleApprove(activity)} className="approve-btn">
                        Принять
                      </button>
                      <button onClick={() => handleReject(activity)} className="reject-btn">
                        Отклонить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Нет заявок на рассмотрении</p>
          )}
        </div>

        <div className="approved-activities">
          <h2>Принятые заявки</h2>
          {approvedActivities.length > 0 ? (
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
                {approvedActivities.map((activity) => (
                  <tr key={`approved-${activity.id}`}>
                    <td>{activity.full_name}</td>
                    <td>{activity.group_name}</td>
                    <td>{activity.supervisor}</td>
                    <td>{activity.activity}</td>
                    <td>
                      {activity.file_name && (
                        <img 
                          src={`http://localhost:8000/uploads/${activity.file_name}`} 
                          alt="Достижение" 
                          width="300"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Нет принятых заявок</p>
          )}
        </div>
        <button 
          onClick={handleLogout}
          className="logout-btn"
        >
          Выйти в меню регистрации
        </button>
      </div>
    </div>
  );
}

export default AdminPage;