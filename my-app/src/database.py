
from sqlalchemy import Column, Integer, String, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

engine = create_engine(
    "sqlite:///activity_registry.db", 
    echo=False,
    connect_args={"check_same_thread": False}
)

Base = declarative_base()

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

class ActivityRequest(Base):
    __tablename__ = "activity_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    
    full_name = Column(String, nullable=False)  # ФИО студента
    group_name = Column(String)                 # Группа
    supervisor = Column(String)                 # Руководитель
    activity = Column(String, nullable=False)   # Название активности
    

    file_name = Column(String, nullable=False) 
    
    status = Column(String, default="pending", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()