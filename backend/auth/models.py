"""
Объектные представления таблиц БД через SQLAlchemy ORM.
Python 3.11, SQLAlchemy 2.x, PostgreSQL.
"""
import os
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer,
    JSON, Numeric, String, Text, Time, Date, Index, create_engine
)
from sqlalchemy.orm import DeclarativeBase, relationship, sessionmaker

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p60955846_expert_appointment_s")


class Base(DeclarativeBase):
    pass


class Specialist(Base):
    __tablename__ = "specialists"
    __table_args__ = {"schema": SCHEMA}
    id: int = Column(Integer, primary_key=True)
    name: str = Column(String(200), nullable=False)
    specialty: str = Column(String(100), nullable=False)
    experience_years: int = Column(Integer, default=0)
    rating: Decimal = Column(Numeric(3, 1), default=5.0)
    reviews_count: int = Column(Integer, default=0)
    price: int = Column(Integer, nullable=False)
    emoji: str = Column(String(10), default="🩺")
    is_available: bool = Column(Boolean, default=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    users = relationship("User", back_populates="specialist")

    def to_dict(self) -> dict:
        return {"id": self.id, "name": self.name, "specialty": self.specialty,
                "emoji": self.emoji, "available": self.is_available}


class User(Base):
    """Пользователь системы (клиент или врач)."""
    __tablename__ = "users"
    __table_args__ = {"schema": SCHEMA}

    id: int = Column(Integer, primary_key=True)
    email: str = Column(String(255), nullable=False, unique=True)
    password_hash: str = Column(String(255), nullable=False)
    full_name: str = Column(String(200), nullable=False)
    phone: str = Column(String(50), nullable=True)
    role: str = Column(String(20), nullable=False, default="client")
    specialist_id: int = Column(Integer, ForeignKey(f"{SCHEMA}.specialists.id"), nullable=True)
    is_active: bool = Column(Boolean, default=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("Session", back_populates="user", cascade="all")
    specialist = relationship("Specialist", back_populates="users")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "phone": self.phone or "",
            "role": self.role,
            "specialist_id": self.specialist_id,
            "is_active": self.is_active,
        }


class Session(Base):
    """Сессия пользователя (токен авторизации)."""
    __tablename__ = "sessions"
    __table_args__ = (
        Index("idx_sessions_token", "token"),
        {"schema": SCHEMA},
    )

    id: int = Column(Integer, primary_key=True)
    user_id: int = Column(Integer, ForeignKey(f"{SCHEMA}.users.id"), nullable=False)
    token: str = Column(String(255), nullable=False, unique=True)
    expires_at: datetime = Column(DateTime, nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")


def get_engine():
    return create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)


def get_session_db():
    engine = get_engine()
    S = sessionmaker(bind=engine)
    return S()
