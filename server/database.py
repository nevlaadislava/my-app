# database.py

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import enum

DATABASE_URL = "sqlite:///./database.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# статус пользователя
class UserStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"

# администраторы
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    login = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    status = Column(String, default=UserStatus.pending)
    role = Column(String, default="admin")

# пользователи
class ActivityRequest(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    group_name = Column(String)
    supervisor = Column(String)
    activity = Column(String)
    event_level = Column(String, nullable=False)
    organizer = Column(String, nullable=False)
    location = Column(String, nullable=False)
    dates = Column(String, nullable=False)
    file_name = Column(String, unique=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()