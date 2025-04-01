from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class SMSRecipient(BaseModel):
    phone: str
    
class SMSMessage(BaseModel):
    recipients: List[SMSRecipient]
    message: str

class SMSResponse(BaseModel):
    success: bool
    message: str
    text_id: Optional[str] = None

class SMSBatchResponse(BaseModel):
    results: List[Dict[str, Any]]
    total_sent: int
    total_failed: int

class PricingPlan(BaseModel):
    id: str
    name: str
    price: float
    description: str
    features: List[str]
