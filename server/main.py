from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
from starlette.staticfiles import StaticFiles
from database import SessionLocal, ActivityRequest, init_db

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