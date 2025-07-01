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

from database import ActivityRequest, init_db, get_db
from database import SessionLocal


init_db()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/api/activities")
async def get_activities():
    db = SessionLocal()
    activities = db.query(ActivityRequest).all()
    db.close()
    return activities

@app.post("/api/activities")
async def create_activity(
    firstname: str = Form(...),
    secondname: str = Form(...),
    patronymic: str = Form(""),
    group: str = Form(...),
    supervisor: str = Form(...),
    activity: str = Form(...),
    photo: UploadFile = File(...)
):
    if photo.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Только JPEG или PNG изображения разрешены")

    file_location = f"uploads/{photo.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(await photo.read())

    db = SessionLocal()
    activity_data = ActivityRequest(
        full_name=f"{secondname} {firstname} {patronymic}".strip(),
        group_name=group,
        supervisor=supervisor,
        activity=activity,
        file_name=photo.filename,
        status="pending"
    )
    db.add(activity_data)
    db.commit()
    db.refresh(activity_data)
    db.close()

    return activity_data

@app.put("/api/activities/{activity_id}/approve")
async def approve_activity(activity_id: int):
    db = SessionLocal()
    activity = db.query(ActivityRequest).filter(ActivityRequest.id == activity_id).first()
    if not activity:
        db.close()
        raise HTTPException(status_code=404, detail="Activity not found")

    activity.status = "approved"
    db.commit()
    db.close()
    return {"message": "Activity approved"}

@app.delete("/api/activities/{activity_id}")
async def delete_activity(activity_id: int):
    db = SessionLocal()
    activity = db.query(ActivityRequest).filter(ActivityRequest.id == activity_id).first()
    if not activity:
        db.close()
        raise HTTPException(status_code=404, detail="Activity not found")

    db.delete(activity)
    db.commit()
    db.close()
    return {"message": "Activity deleted"}

@app.get("/api/activities/download")
async def download_activities_excel(db: Session = Depends(get_db)):
    """
    Скачивает все данные по активностям в виде Excel-файла с встроенными изображениями.
    """
    activities_query = db.query(ActivityRequest).order_by(ActivityRequest.created_at.desc()).all()

    if not activities_query:
         raise HTTPException(status_code=404, detail="Нет активностей для выгрузки")

    activities_list = [
        {
            "ФИО студента": act.full_name,
            "Группа": act.group_name,
            "Руководитель": act.supervisor,
            "Название активности": act.activity,
            "Статус": act.status,
            "Дата создания": act.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "_file_name": act.file_name 
        }
        for act in activities_query
    ]
    
    df = pd.DataFrame(activities_list).drop(columns=['_file_name'])
    df["Изображение"] = ""

    output_buffer = BytesIO()
    with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Активности')
        
        worksheet = writer.sheets['Активности']

        for idx, col in enumerate(df.columns[:-1]): 
            column_length = max(df[col].astype(str).map(len).max(), len(col))
            worksheet.column_dimensions[chr(65 + idx)].width = column_length + 2

        image_col_letter = chr(65 + len(df.columns) - 1)
        worksheet.column_dimensions[image_col_letter].width = 30 

        for index, activity_data in enumerate(activities_list, start=2):

            worksheet.row_dimensions[index].height = 100 
            
            image_path = os.path.join("uploads", activity_data["_file_name"])
            
            if os.path.exists(image_path):
                try:
                    img = OpenpyxlImage(image_path)
                    img.height = 120
                    img.width = 160

                    cell_location = f'{image_col_letter}{index}'
                    worksheet.add_image(img, cell_location)
                except Exception as e:
                    print(f"Не удалось вставить изображение {image_path}: {e}")
                    # Можно записать в ячейку сообщение об ошибке
                    worksheet[f'{image_col_letter}{index}'] = "Ошибка загрузки изображения"

    output_buffer.seek(0)

    filename = f"activity_report_{datetime.now().strftime('%Y-%m-%d')}.xlsx"
    headers = {
        "Content-Disposition": f"attachment; filename=\"{filename}\""
    }

    return StreamingResponse(
        output_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )

