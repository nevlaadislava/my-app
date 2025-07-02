
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
import pandas as pd
from io import BytesIO
from datetime import datetime
import os
from starlette.staticfiles import StaticFiles
from openpyxl.drawing.image import Image as OpenpyxlImage
from pydantic import BaseModel, Field, ConfigDict
from passlib.context import CryptContext
from database import ActivityRequest, User, UserStatus, init_db, get_db
from typing import List
from urllib.parse import quote
from enum import Enum

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MAIN_ADMIN_LOGIN = os.getenv("MAIN_ADMIN_LOGIN", "admin")
MAIN_ADMIN_PASSWORD = os.getenv("MAIN_ADMIN_PASSWORD", "admin")

init_db()

app = FastAPI()

@app.on_event("startup")
def create_main_admin_on_startup():
    db = next(get_db())
    # Ищем пользователя по логину
    user = db.query(User).filter(User.login == MAIN_ADMIN_LOGIN).first()

    if not user:
        print(f"Главный администратор '{MAIN_ADMIN_LOGIN}' не найден, создаем нового.")
        hashed_password = pwd_context.hash(MAIN_ADMIN_PASSWORD)
        new_main_admin = User(
            login=MAIN_ADMIN_LOGIN,
            hashed_password=hashed_password,
            status=UserStatus.approved,
            role="main_admin"
        )
        db.add(new_main_admin)
        db.commit()
        print(f"Главный администратор '{MAIN_ADMIN_LOGIN}' успешно создан.")
    elif user.role != "main_admin" or user.status != UserStatus.approved:
        user.role = "main_admin"
        user.status = UserStatus.approved
        user.hashed_password = pwd_context.hash(MAIN_ADMIN_PASSWORD)
        db.commit()
        print(f"Пользователь '{MAIN_ADMIN_LOGIN}' успешно обновлен до главного администратора.")
    else:
        print(f"Главный администратор '{MAIN_ADMIN_LOGIN}' уже существует.")
    
    db.close()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

class EventLevel(str, Enum):
    international = "международный"
    national = "всероссийский"
    city = "городской"
    regional = "региональный"
    university = "внутривузовская"

class UserCredentials(BaseModel):
    login: str
    password: str

class UserCreate(UserCredentials):
    pass

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    login: str
    status: UserStatus
    role: str

@app.post("/api/login")
async def login_for_access(credentials: UserCredentials, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == credentials.login).first()

    if not user or user.status != UserStatus.approved or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Неверный логин или пароль, или учетная запись не подтверждена",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"message": "Успешный вход. ", "role": user.role}

@app.post("/api/register", status_code=201)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.login == user_data.login).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким логином уже существует")

    hashed_password = get_password_hash(user_data.password)
    new_user = User(login=user_data.login, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    return {"message": "Заявка на регистрацию отправлена. Ожидайте подтверждения от главного администратора."}

@app.get("/api/admin/requests", response_model=List[UserOut])
async def get_pending_registrations(db: Session = Depends(get_db)):
    pending_users = db.query(User).filter(User.status == UserStatus.pending).all()
    return pending_users

@app.put("/api/admin/requests/{user_id}/approve")
async def approve_registration(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.status == UserStatus.approved:
        raise HTTPException(status_code=400, detail="Пользователь уже подтвержден")

    user.status = UserStatus.approved
    db.commit()
    return {"message": f"Пользователь '{user.login}' подтвержден."}

@app.delete("/api/admin/requests/{user_id}/reject")
async def reject_registration(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    db.delete(user)
    db.commit()
    return {"message": f"Заявка от пользователя '{user.login}' отклонена и удалена."}

@app.get("/api/activities")
async def get_activities(db: Session = Depends(get_db)):
    activities = db.query(ActivityRequest).all()
    return activities

@app.post("/api/activities")
async def create_activity(
    firstname: str = Form(...),
    secondname: str = Form(...),
    patronymic: str = Form(""),
    group: str = Form(...),
    supervisor: str = Form(...),
    activity: str = Form(...),
    event_level: EventLevel = Form(...),
    organizer: str = Form(...),
    location: str = Form(...),
    dates: str = Form(...),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # проверка типа файла
    if photo.content_type not in ["image/jpeg", "image/png", "application/pdf"]:
        raise HTTPException(status_code=400, detail="Разрешены только JPEG, PNG или PDF")

    # уникальное имя файла
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique_filename = f"{timestamp}_{photo.filename}"
    file_location = f"uploads/{unique_filename}"

    with open(file_location, "wb+") as file_object:
        file_object.write(await photo.read())

    # создание записи активности в базе данных
    activity_data = ActivityRequest(
        full_name=f"{secondname} {firstname} {patronymic}".strip(),
        group_name=group,
        supervisor=supervisor,
        activity=activity,
        event_level=event_level.value,
        organizer=organizer,
        location=location,
        dates=dates,
        file_name=unique_filename,
        status="pending"
    )
    db.add(activity_data)
    db.commit()
    db.refresh(activity_data)
    return activity_data

# подтверждение активности
@app.put("/api/activities/{activity_id}/approve")
async def approve_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(ActivityRequest).filter(ActivityRequest.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Активность не найдена")

    activity.status = "approved"
    db.commit()
    return {"message": "Активность подтверждена"}

# удаление активности и её файла
@app.delete("/api/activities/{activity_id}")
async def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(ActivityRequest).filter(ActivityRequest.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Активность не найдена")
    file_to_delete_name = activity.file_name
    db.delete(activity)
    db.commit()
    if file_to_delete_name:
        file_path = os.path.join("uploads", file_to_delete_name)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError as e:
                print(f"Ошибка удаления {file_path}: {e}")
    return {"message": "Активность удалена."}

# генерация Excel-отчёта с изображениями
def _generate_excel_report(activities_list: List[dict]) -> BytesIO:
    df = pd.DataFrame(activities_list).drop(columns=['_file_name'])
    df["Изображение"] = ""

    output_buffer = BytesIO()
    with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Активности')
        worksheet = writer.sheets['Активности']

        # Автоматическая ширина столбцов
        for idx, col in enumerate(df.columns[:-1]):
            column_length = max(df[col].astype(str).map(len).max(), len(col))
            worksheet.column_dimensions[chr(65 + idx)].width = column_length + 2

        image_col_letter = chr(65 + len(df.columns) - 1)
        worksheet.column_dimensions[image_col_letter].width = 30

        # Добавление изображений
        for index, activity_data in enumerate(activities_list, start=2):
            worksheet.row_dimensions[index].height = 100
            image_path = os.path.join("uploads", activity_data["_file_name"])
            if os.path.exists(image_path):
                try:
                    img = OpenpyxlImage(image_path)
                    img.height = 120
                    img.width = 160
                    worksheet.add_image(img, f'{image_col_letter}{index}')
                except Exception as e:
                    print(f"Не удалось вставить изображение {image_path}: {e}")
                    worksheet[f'{image_col_letter}{index}'] = "Ошибка загрузки изображения"

    output_buffer.seek(0)
    return output_buffer

# скачивание Excel-файла со всеми активностями
@app.get("/api/activities/download")
async def download_activities_excel(db: Session = Depends(get_db)):
    activities_query = db.query(ActivityRequest).order_by(ActivityRequest.created_at.desc()).all()

    if not activities_query:
        raise HTTPException(status_code=404, detail="Нет активностей для выгрузки")

    activities_list = [
        {
            "ФИО студента": act.full_name,  # ИСПРАВЛЕНО
            "Группа": act.group_name,  # ИСПРАВЛЕНО
            "Руководитель": act.supervisor,  # ИСПРАВЛЕНО
            "Название активности": act.activity,  # ИСПРАВЛЕНО
            "Уровень мероприятия": act.event_level,  # ИСПРАВЛЕНО
            "Организатор": act.organizer,
            "Место проведения": act.location,
            "Даты проведения": act.dates,
            "Статус": act.status,
            "Дата создания": act.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "_file_name": act.file_name
        }
        for act in activities_query # Переменная цикла здесь `act`
    ]

    output_buffer = _generate_excel_report(activities_list)
    filename = f"activity_report_all_{datetime.now().strftime('%Y-%m-%d')}.xlsx"
    headers = {
        "Content-Disposition": f"attachment; filename=\"{filename}\""
    }

    return StreamingResponse(
        output_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )

# скачивание Excel-файла по одной активности
@app.get("/api/activities/{activity_id}/download")
async def download_single_activity_excel(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(ActivityRequest).filter(ActivityRequest.id == activity_id).first()

    if not activity:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    activity_list = [{
        "ФИО студента": activity.full_name,
        "Группа": activity.group_name,
        "Руководитель": activity.supervisor,
        "Название активности": activity.activity,
        "Уровень мероприятия": activity.event_level,
        "Организатор": activity.organizer,
        "Место проведения": activity.location,
        "Даты проведения": activity.dates,
        "Статус": activity.status,
        "Дата создания": activity.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "_file_name": activity.file_name
    }]
    
    output_buffer = _generate_excel_report(activity_list)

    original_filename = f"activity_{activity.id}_{activity.full_name.split()[0]}_{datetime.now().strftime('%Y-%m-%d')}.xlsx"
    ascii_filename = f"activity_{activity.id}.xlsx"
    encoded_filename = quote(original_filename)

    headers = {
        "Content-Disposition": f"attachment; filename=\"{ascii_filename}\"; filename*=UTF-8''{encoded_filename}"
    }

    return StreamingResponse(
        output_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )