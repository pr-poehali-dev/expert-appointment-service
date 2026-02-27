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
    """Врач-специалист клиники."""
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

    schedules = relationship("Schedule", back_populates="specialist", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="specialist")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "specialty": self.specialty,
            "experience": f"{self.experience_years} лет",
            "rating": float(self.rating),
            "reviews": self.reviews_count,
            "price": f"{self.price:,} ₽".replace(",", "\u00a0"),
            "emoji": self.emoji,
            "available": self.is_available,
        }


class Schedule(Base):
    """Слот расписания специалиста."""
    __tablename__ = "schedules"
    __table_args__ = {"schema": SCHEMA}

    id: int = Column(Integer, primary_key=True)
    specialist_id: int = Column(Integer, ForeignKey(f"{SCHEMA}.specialists.id"), nullable=False)
    work_date = Column(Date, nullable=False)
    slot_time = Column(Time, nullable=False)
    is_booked: bool = Column(Boolean, default=False)

    specialist = relationship("Specialist", back_populates="schedules")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "specialist_id": self.specialist_id,
            "date": self.work_date.isoformat(),
            "time": self.slot_time.strftime("%H:%M"),
            "status": "booked" if self.is_booked else "available",
        }


class Appointment(Base):
    """Запись пациента на приём."""
    __tablename__ = "appointments"
    __table_args__ = {"schema": SCHEMA}

    id: int = Column(Integer, primary_key=True)
    specialist_id: int = Column(Integer, ForeignKey(f"{SCHEMA}.specialists.id"), nullable=False)
    patient_name: str = Column(String(200), nullable=False)
    patient_phone: str = Column(String(50), nullable=False)
    patient_comment: str = Column(Text, nullable=True)
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    status: str = Column(String(30), default="pending")
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    specialist = relationship("Specialist", back_populates="appointments")
    notifications = relationship("Notification", back_populates="appointment")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "specialist_id": self.specialist_id,
            "patient": self.patient_name,
            "phone": self.patient_phone,
            "comment": self.patient_comment or "",
            "date": self.appointment_date.isoformat(),
            "time": self.appointment_time.strftime("%H:%M"),
            "status": self.status,
            "doctor": self.specialist.name if self.specialist else None,
            "specialty": self.specialist.specialty if self.specialist else None,
        }


class Notification(Base):
    """Уведомление, связанное с записью."""
    __tablename__ = "notifications"
    __table_args__ = {"schema": SCHEMA}

    id: int = Column(Integer, primary_key=True)
    appointment_id: int = Column(Integer, ForeignKey(f"{SCHEMA}.appointments.id"), nullable=True)
    type: str = Column(String(50), nullable=False)
    title: str = Column(String(200), nullable=False)
    message: str = Column(Text, nullable=False)
    channel: str = Column(String(50), default="email")
    is_read: bool = Column(Boolean, default=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="notifications")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "appointment_id": self.appointment_id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "channel": self.channel,
            "read": self.is_read,
            "time": self.created_at.isoformat() if self.created_at else None,
        }


class Event(Base):
    """
    Очередь событий между микросервисами (Transactional Outbox Pattern).
    Заменяет Kafka: сервисы публикуют события сюда, потребители читают по топику.
    """
    __tablename__ = "events"
    __table_args__ = (
        Index("idx_events_topic_status", "topic", "status"),
        {"schema": SCHEMA},
    )

    id: int = Column(Integer, primary_key=True)
    topic: str = Column(String(100), nullable=False)
    payload: dict = Column(JSON, nullable=False)
    status: str = Column(String(20), default="pending")
    produced_by: str = Column(String(100), nullable=False)
    consumed_by: str = Column(String(100), nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    processed_at: datetime = Column(DateTime, nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "topic": self.topic,
            "payload": self.payload,
            "status": self.status,
            "produced_by": self.produced_by,
            "consumed_by": self.consumed_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
        }


def get_engine():
    return create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)


def get_session():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()
