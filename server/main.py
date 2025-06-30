from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Activity(BaseModel):
    firstname: str
    secondname: str
    patronymic: str = ""
    group: str
    supervisor: str
    photo_filename: str 

activities_db = []

os.makedirs("uploads", exist_ok=True)

@app.get("/api/activities", response_model=List[Activity])
async def get_activities():
    return activities_db

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
    
    activity_data = {
        "firstname": firstname,
        "secondname": secondname,
        "patronymic": patronymic,
        "group": group,
        "supervisor": supervisor,
        "activity": activity,
        "photo_filename": photo.filename
    }
    
    activities_db.append(activity_data)
    
    return activity_data