import os
import logging
from typing import Optional, Dict, Any, List
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/lightsms")

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    organization = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    contact_groups = relationship("ContactGroup", back_populates="user")
    contacts = relationship("Contact", back_populates="user")
    message_templates = relationship("MessageTemplate", back_populates="user")
    campaigns = relationship("Campaign", back_populates="user")

class ContactGroup(Base):
    __tablename__ = "contact_groups"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="contact_groups")
    contacts = relationship("Contact", back_populates="group")
    campaigns = relationship("Campaign", secondary="campaign_groups", back_populates="groups")

class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    group_id = Column(Integer, ForeignKey("contact_groups.id"))
    phone_number = Column(String(20), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255))
    custom_fields = Column(JSON)
    is_active = Column(Boolean, default=True)
    has_opted_out = Column(Boolean, default=False)
    opt_out_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    average_response_time = Column(Integer)
    last_message_hour = Column(Integer)
    message_open_rate = Column(Float)
    engagement_score = Column(Float)
    
    user = relationship("User", back_populates="contacts")
    group = relationship("ContactGroup", back_populates="contacts")
    messages = relationship("SmsMessage", back_populates="contact")
    responses = relationship("Response", back_populates="contact")

class MessageTemplate(Base):
    __tablename__ = "message_templates"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="message_templates")
    campaigns = relationship("Campaign", back_populates="template")

class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), nullable=False)  # scheduled, in_progress, completed, cancelled
    scheduled_time = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    use_optimal_time = Column(Boolean, default=False)
    template_id = Column(Integer, ForeignKey("message_templates.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="campaigns")
    template = relationship("MessageTemplate", back_populates="campaigns")
    groups = relationship("ContactGroup", secondary="campaign_groups", back_populates="campaigns")
    messages = relationship("SmsMessage", back_populates="campaign")

class CampaignGroup(Base):
    __tablename__ = "campaign_groups"
    
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("contact_groups.id"), primary_key=True)

class SmsMessage(Base):
    __tablename__ = "sms_messages"
    
    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    message_content = Column(Text, nullable=False)
    status = Column(String(50), nullable=False)  # sent, delivered, failed
    error_message = Column(Text)
    external_id = Column(String(255))  # ID from SMS provider
    sent_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    delivery_status = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    campaign = relationship("Campaign", back_populates="messages")
    contact = relationship("Contact", back_populates="messages")
    responses = relationship("Response", back_populates="message")

class Response(Base):
    __tablename__ = "responses"
    
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey("sms_messages.id"))
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    response_text = Column(Text)
    response_time = Column(Integer)  # milliseconds between sent and response
    sentiment_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    message = relationship("SmsMessage", back_populates="responses")
    contact = relationship("Contact", back_populates="responses")

class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    
    id = Column(Integer, primary_key=True)
    event_type = Column(String(50), nullable=False)
    event_data = Column(JSON)
    user_id = Column(Integer, ForeignKey("users.id"))
    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    message_id = Column(Integer, ForeignKey("sms_messages.id"))
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Database:
    def __init__(self):
        self.engine = None
        self.Session = None
        self.connected = False
        self.in_memory_db = {}
        
        try:
            self.engine = create_engine(DATABASE_URL)
            self.Session = sessionmaker(bind=self.engine)
            
            Base.metadata.create_all(self.engine)
            
            self.connected = True
            logger.info("Successfully connected to PostgreSQL")
        except Exception as e:
            logger.warning(f"Failed to connect to PostgreSQL: {e}")
            logger.info("Using in-memory database as fallback")
            
            self.in_memory_db = {
                "users": {},
                "messages": {}
            }
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get a user by email"""
        if self.connected:
            try:
                session = self.Session()
                user = session.query(User).filter(User.email == email).first()
                if user:
                    return {
                        "id": user.id,
                        "email": user.email,
                        "password_hash": user.password_hash,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "organization": user.organization,
                        "created_at": user.created_at.isoformat() if user.created_at else None,
                        "updated_at": user.updated_at.isoformat() if user.updated_at else None
                    }
                return None
            except Exception as e:
                logger.error(f"Error querying PostgreSQL: {e}")
                return None
            finally:
                session.close()
        else:
            for user_id, user in self.in_memory_db.get("users", {}).items():
                if user.get("email") == email:
                    return user
            return None
    
    def create_user(self, user_data: Dict[str, Any]) -> Optional[str]:
        """Create a new user"""
        if self.connected:
            try:
                session = self.Session()
                user = User(
                    email=user_data.get("email"),
                    password_hash=user_data.get("password_hash"),
                    first_name=user_data.get("first_name"),
                    last_name=user_data.get("last_name"),
                    organization=user_data.get("organization")
                )
                session.add(user)
                session.commit()
                return str(user.id)
            except Exception as e:
                logger.error(f"Error creating user in PostgreSQL: {e}")
                session.rollback()
                return None
            finally:
                session.close()
        else:
            user_id = f"user_{len(self.in_memory_db.get('users', {})) + 1}"
            user_data["id"] = user_id
            self.in_memory_db.setdefault("users", {})[user_id] = user_data
            return user_id
    
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by ID"""
        if self.connected:
            try:
                session = self.Session()
                user = session.query(User).filter(User.id == int(user_id)).first()
                if user:
                    return {
                        "id": user.id,
                        "email": user.email,
                        "password_hash": user.password_hash,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "organization": user.organization,
                        "created_at": user.created_at.isoformat() if user.created_at else None,
                        "updated_at": user.updated_at.isoformat() if user.updated_at else None
                    }
                return None
            except Exception as e:
                logger.error(f"Error getting user from PostgreSQL: {e}")
                return None
            finally:
                session.close()
        else:
            return self.in_memory_db.get("users", {}).get(user_id)
    
    def save_message(self, message_data: Dict[str, Any]) -> Optional[str]:
        """Save a message"""
        if self.connected:
            try:
                session = self.Session()
                message = SmsMessage(
                    campaign_id=message_data.get("campaign_id"),
                    contact_id=message_data.get("contact_id"),
                    message_content=message_data.get("message_content"),
                    status=message_data.get("status", "sent"),
                    error_message=message_data.get("error_message"),
                    external_id=message_data.get("external_id"),
                    sent_at=message_data.get("sent_at"),
                    delivered_at=message_data.get("delivered_at"),
                    delivery_status=message_data.get("delivery_status")
                )
                session.add(message)
                session.commit()
                return str(message.id)
            except Exception as e:
                logger.error(f"Error saving message to PostgreSQL: {e}")
                session.rollback()
                return None
            finally:
                session.close()
        else:
            message_id = f"msg_{len(self.in_memory_db.get('messages', {})) + 1}"
            message_data["id"] = message_id
            self.in_memory_db.setdefault("messages", {})[message_id] = message_data
            return message_id
    
    def get_user_messages(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a user"""
        if self.connected:
            try:
                session = self.Session()
                messages = session.query(SmsMessage).join(Campaign).filter(Campaign.user_id == int(user_id)).all()
                return [{
                    "id": msg.id,
                    "campaign_id": msg.campaign_id,
                    "contact_id": msg.contact_id,
                    "message_content": msg.message_content,
                    "status": msg.status,
                    "error_message": msg.error_message,
                    "external_id": msg.external_id,
                    "sent_at": msg.sent_at.isoformat() if msg.sent_at else None,
                    "delivered_at": msg.delivered_at.isoformat() if msg.delivered_at else None,
                    "delivery_status": msg.delivery_status,
                    "created_at": msg.created_at.isoformat() if msg.created_at else None
                } for msg in messages]
            except Exception as e:
                logger.error(f"Error getting messages from PostgreSQL: {e}")
                return []
            finally:
                session.close()
        else:
            return [
                msg for msg in self.in_memory_db.get("messages", {}).values()
                if msg.get("user_id") == user_id
            ]

db_pg = Database()
