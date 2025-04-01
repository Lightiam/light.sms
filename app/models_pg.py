from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    organization: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ContactBase(BaseModel):
    phone_number: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    custom_fields: Optional[Dict[str, Any]] = None

class ContactCreate(ContactBase):
    group_id: Optional[int] = None

class Contact(ContactBase):
    id: int
    user_id: int
    group_id: Optional[int] = None
    is_active: bool = True
    has_opted_out: bool = False
    opt_out_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    average_response_time: Optional[int] = None
    last_message_hour: Optional[int] = None
    message_open_rate: Optional[float] = None
    engagement_score: Optional[float] = None

    class Config:
        orm_mode = True

class ContactGroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class ContactGroupCreate(ContactGroupBase):
    pass

class ContactGroup(ContactGroupBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    contact_count: Optional[int] = None

    class Config:
        orm_mode = True

class MessageTemplateBase(BaseModel):
    name: str
    content: str

class MessageTemplateCreate(MessageTemplateBase):
    pass

class MessageTemplate(MessageTemplateBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CampaignBase(BaseModel):
    name: str
    message: str
    scheduled_time: Optional[datetime] = None
    use_optimal_time: bool = False

class CampaignCreate(CampaignBase):
    group_ids: List[int]
    template_id: Optional[int] = None

class Campaign(CampaignBase):
    id: int
    user_id: int
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    template_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    groups: List[ContactGroup] = []

    class Config:
        orm_mode = True

class SmsMessageBase(BaseModel):
    message_content: str
    status: str = "sent"

class SmsMessageCreate(SmsMessageBase):
    campaign_id: Optional[int] = None
    contact_id: int

class SmsMessage(SmsMessageBase):
    id: int
    campaign_id: Optional[int] = None
    contact_id: int
    error_message: Optional[str] = None
    external_id: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    delivery_status: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

class ResponseBase(BaseModel):
    response_text: Optional[str] = None
    response_time: Optional[int] = None
    sentiment_score: Optional[float] = None

class ResponseCreate(ResponseBase):
    message_id: int
    contact_id: int

class Response(ResponseBase):
    id: int
    message_id: int
    contact_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class AnalyticsEventBase(BaseModel):
    event_type: str
    event_data: Optional[Dict[str, Any]] = None

class AnalyticsEventCreate(AnalyticsEventBase):
    user_id: Optional[int] = None
    campaign_id: Optional[int] = None
    message_id: Optional[int] = None
    contact_id: Optional[int] = None

class AnalyticsEvent(AnalyticsEventBase):
    id: int
    user_id: Optional[int] = None
    campaign_id: Optional[int] = None
    message_id: Optional[int] = None
    contact_id: Optional[int] = None
    created_at: datetime

    class Config:
        orm_mode = True

class SMSRequest(BaseModel):
    phone: str
    message: str

class SMSResponse(BaseModel):
    success: bool
    message: str
    text_id: Optional[str] = None

class SMSBatchRequest(BaseModel):
    phones: List[str]
    message: str

class SMSBatchResponse(BaseModel):
    total_sent: int
    total_failed: int
    results: List[SMSResponse]

class PricingPlan(BaseModel):
    id: str
    name: str
    price: float
    description: str
    features: List[str]
