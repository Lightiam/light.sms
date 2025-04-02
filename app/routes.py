from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Dict, Any, List, Optional
from datetime import datetime
import os
import requests
import json

from app.database_pg import db_pg as db
from app.models_pg import (
    User, Campaign, CampaignCreate, SmsMessage, SmsMessageCreate, 
    SMSResponse, SMSBatchResponse, PricingPlan
)
from app.auth import get_current_active_user

router = APIRouter()

TEXTBELT_API_URL = "https://textbelt.com/text"
TEXTBELT_API_KEY = os.getenv("TEXTBELT_API_KEY", "")
TEXTBELT_STATUS_URL = "https://textbelt.com/status"

@router.post("/campaigns", response_model=Dict[str, Any])
async def create_campaign(
    campaign_data: CampaignCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create and schedule a campaign"""
    try:
        campaign_data_dict = campaign_data.dict()
        campaign_data_dict["user_id"] = current_user.id
        
        campaign_id = db.create_campaign(campaign_data_dict)
        
        if not campaign_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create campaign"
            )
        
        if campaign_data.scheduled_time:
            db.update_campaign_status(campaign_id, "scheduled")
        
        campaign = db.get_campaign(campaign_id)
        
        return {"success": True, "campaign": campaign}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create campaign: {str(e)}"
        )

@router.get("/status/{text_id}", response_model=Dict[str, Any])
async def check_message_status(
    text_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Check the status of a message"""
    try:
        if not TEXTBELT_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="TextBelt API key not configured"
            )
        
        response = requests.get(
            f"{TEXTBELT_STATUS_URL}/{text_id}",
            params={"key": TEXTBELT_API_KEY}
        )
        
        data = response.json()
        
        message = db.get_message_by_external_id(text_id)
        if message:
            status_update = {
                "status": "delivered" if data.get("status") == "DELIVERED" else "sent",
                "delivery_status": data.get("status"),
                "delivered_at": datetime.utcnow().isoformat() if data.get("status") == "DELIVERED" else None
            }
            db.update_message(message["id"], status_update)
        
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to check message status: {str(e)}"
        )

@router.get("/quota", response_model=Dict[str, Any])
async def check_quota(
    current_user: User = Depends(get_current_active_user)
):
    """Check the SMS quota for the current user"""
    try:
        
        user_plan = "basic"  # Default to basic plan
        
        quota_total = 1000  # Default for basic plan
        if user_plan == "pro":
            quota_total = 2000
        elif user_plan == "enterprise":
            quota_total = 4000
        
        messages_sent = db.count_user_messages_this_month(current_user.id)
        
        quota_remaining = max(0, quota_total - messages_sent)
        
        now = datetime.utcnow()
        if now.month == 12:
            reset_date = datetime(now.year + 1, 1, 1)
        else:
            reset_date = datetime(now.year, now.month + 1, 1)
        
        return {
            "quota_total": quota_total,
            "quota_used": messages_sent,
            "quota_remaining": quota_remaining,
            "reset_date": reset_date.isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to check quota: {str(e)}"
        )

@router.post("/webhook/replies")
async def handle_sms_replies(request: Request):
    """Webhook endpoint for SMS replies"""
    try:
        payload = await request.json()
        
        print(f"Received SMS reply webhook: {payload}")
        
        
        message_id = payload.get("messageId")
        phone_number = payload.get("from")
        text = payload.get("text")
        
        if message_id and phone_number and text:
            message = db.get_message_by_external_id(message_id)
            
            if message:
                response_data = {
                    "message_id": message["id"],
                    "contact_id": message["contact_id"],
                    "response_text": text,
                    "created_at": datetime.utcnow().isoformat()
                }
                
                db.save_response(response_data)
                
                return {"success": True, "message": "Reply processed successfully"}
        
        return {"success": True, "message": "Webhook received"}
    except Exception as e:
        print(f"Error handling SMS reply webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process SMS reply: {str(e)}"
        )

def get_message_by_external_id(db, external_id):
    """Get a message by its external ID"""
    if db.connected:
        try:
            session = db.Session()
            message = session.query(db.SmsMessage).filter(db.SmsMessage.external_id == external_id).first()
            if message:
                return {
                    "id": message.id,
                    "campaign_id": message.campaign_id,
                    "contact_id": message.contact_id,
                    "message_content": message.message_content,
                    "status": message.status,
                    "error_message": message.error_message,
                    "external_id": message.external_id,
                    "sent_at": message.sent_at.isoformat() if message.sent_at else None,
                    "delivered_at": message.delivered_at.isoformat() if message.delivered_at else None,
                    "delivery_status": message.delivery_status,
                    "created_at": message.created_at.isoformat() if message.created_at else None
                }
            return None
        except Exception as e:
            print(f"Error getting message by external ID: {e}")
            return None
        finally:
            session.close()
    else:
        for msg_id, msg in db.in_memory_db.get("messages", {}).items():
            if msg.get("external_id") == external_id:
                return msg
        return None

def update_message(db, message_id, update_data):
    """Update a message"""
    if db.connected:
        try:
            session = db.Session()
            message = session.query(db.SmsMessage).filter(db.SmsMessage.id == message_id).first()
            if message:
                for key, value in update_data.items():
                    if hasattr(message, key):
                        setattr(message, key, value)
                session.commit()
                return True
            return False
        except Exception as e:
            print(f"Error updating message: {e}")
            session.rollback()
            return False
        finally:
            session.close()
    else:
        if message_id in db.in_memory_db.get("messages", {}):
            db.in_memory_db["messages"][message_id].update(update_data)
            return True
        return False

def count_user_messages_this_month(db, user_id):
    """Count the number of messages sent by a user this month"""
    if db.connected:
        try:
            session = db.Session()
            now = datetime.utcnow()
            start_of_month = datetime(now.year, now.month, 1)
            
            count = session.query(db.SmsMessage)\
                .join(db.Campaign)\
                .filter(db.Campaign.user_id == user_id)\
                .filter(db.SmsMessage.created_at >= start_of_month)\
                .count()
            
            return count
        except Exception as e:
            print(f"Error counting user messages: {e}")
            return 0
        finally:
            session.close()
    else:
        count = 0
        for msg in db.in_memory_db.get("messages", {}).values():
            if msg.get("user_id") == user_id:
                created_at = datetime.fromisoformat(msg.get("created_at"))
                now = datetime.utcnow()
                if created_at.year == now.year and created_at.month == now.month:
                    count += 1
        return count

def create_campaign(db, campaign_data):
    """Create a campaign"""
    if db.connected:
        try:
            session = db.Session()
            campaign = db.Campaign(
                user_id=campaign_data.get("user_id"),
                name=campaign_data.get("name"),
                message=campaign_data.get("message"),
                status="draft",
                scheduled_time=campaign_data.get("scheduled_time"),
                use_optimal_time=campaign_data.get("use_optimal_time", False),
                template_id=campaign_data.get("template_id")
            )
            session.add(campaign)
            session.commit()
            
            for group_id in campaign_data.get("group_ids", []):
                campaign_group = db.CampaignGroup(
                    campaign_id=campaign.id,
                    group_id=group_id
                )
                session.add(campaign_group)
            
            session.commit()
            return campaign.id
        except Exception as e:
            print(f"Error creating campaign: {e}")
            session.rollback()
            return None
        finally:
            session.close()
    else:
        campaign_id = f"campaign_{len(db.in_memory_db.get('campaigns', {})) + 1}"
        campaign_data["id"] = campaign_id
        campaign_data["status"] = "draft"
        campaign_data["created_at"] = datetime.utcnow().isoformat()
        campaign_data["updated_at"] = datetime.utcnow().isoformat()
        db.in_memory_db.setdefault("campaigns", {})[campaign_id] = campaign_data
        return campaign_id

def get_campaign(db, campaign_id):
    """Get a campaign by ID"""
    if db.connected:
        try:
            session = db.Session()
            campaign = session.query(db.Campaign).filter(db.Campaign.id == campaign_id).first()
            if campaign:
                return {
                    "id": campaign.id,
                    "user_id": campaign.user_id,
                    "name": campaign.name,
                    "message": campaign.message,
                    "status": campaign.status,
                    "scheduled_time": campaign.scheduled_time.isoformat() if campaign.scheduled_time else None,
                    "started_at": campaign.started_at.isoformat() if campaign.started_at else None,
                    "completed_at": campaign.completed_at.isoformat() if campaign.completed_at else None,
                    "use_optimal_time": campaign.use_optimal_time,
                    "template_id": campaign.template_id,
                    "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
                    "updated_at": campaign.updated_at.isoformat() if campaign.updated_at else None
                }
            return None
        except Exception as e:
            print(f"Error getting campaign: {e}")
            return None
        finally:
            session.close()
    else:
        return db.in_memory_db.get("campaigns", {}).get(campaign_id)

def update_campaign_status(db, campaign_id, status):
    """Update a campaign's status"""
    if db.connected:
        try:
            session = db.Session()
            campaign = session.query(db.Campaign).filter(db.Campaign.id == campaign_id).first()
            if campaign:
                campaign.status = status
                if status == "in_progress":
                    campaign.started_at = datetime.utcnow()
                elif status == "completed":
                    campaign.completed_at = datetime.utcnow()
                session.commit()
                return True
            return False
        except Exception as e:
            print(f"Error updating campaign status: {e}")
            session.rollback()
            return False
        finally:
            session.close()
    else:
        if campaign_id in db.in_memory_db.get("campaigns", {}):
            db.in_memory_db["campaigns"][campaign_id]["status"] = status
            if status == "in_progress":
                db.in_memory_db["campaigns"][campaign_id]["started_at"] = datetime.utcnow().isoformat()
            elif status == "completed":
                db.in_memory_db["campaigns"][campaign_id]["completed_at"] = datetime.utcnow().isoformat()
            return True
        return False

def save_response(db, response_data):
    """Save a message response"""
    if db.connected:
        try:
            session = db.Session()
            response = db.Response(
                message_id=response_data.get("message_id"),
                contact_id=response_data.get("contact_id"),
                response_text=response_data.get("response_text"),
                response_time=response_data.get("response_time"),
                sentiment_score=response_data.get("sentiment_score")
            )
            session.add(response)
            session.commit()
            return response.id
        except Exception as e:
            print(f"Error saving response: {e}")
            session.rollback()
            return None
        finally:
            session.close()
    else:
        response_id = f"response_{len(db.in_memory_db.get('responses', {})) + 1}"
        response_data["id"] = response_id
        response_data["created_at"] = datetime.utcnow().isoformat()
        db.in_memory_db.setdefault("responses", {})[response_id] = response_data
        return response_id

db.get_message_by_external_id = lambda external_id: get_message_by_external_id(db, external_id)
db.update_message = lambda message_id, update_data: update_message(db, message_id, update_data)
db.count_user_messages_this_month = lambda user_id: count_user_messages_this_month(db, user_id)
db.create_campaign = lambda campaign_data: create_campaign(db, campaign_data)
db.get_campaign = lambda campaign_id: get_campaign(db, campaign_id)
db.update_campaign_status = lambda campaign_id, status: update_campaign_status(db, campaign_id, status)
db.save_response = lambda response_data: save_response(db, response_data)
