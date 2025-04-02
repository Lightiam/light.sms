from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta
import os
import requests
from typing import List

try:
    from app.database_pg import db_pg as db
    from app.models_pg import User, UserCreate, Token, SMSMessage, SMSResponse, SMSBatchResponse, PricingPlan
    from app.auth import (
        authenticate_user, create_access_token,
        get_current_active_user, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
    )
    print("Using PostgreSQL database")
except ImportError:
    from app.database import db
    from app.auth import (
        User, UserCreate, Token, authenticate_user, create_access_token,
        get_current_active_user, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
    )
    from app.models import SMSMessage, SMSResponse, SMSBatchResponse, PricingPlan
    print("Using CouchDB database")

app = FastAPI(title="LightSMS API", description="Bulk SMS messaging API using TextBelt")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

from app.routes import router as sms_router
app.include_router(sms_router, prefix="/api/sms", tags=["sms"])

TEXTBELT_API_URL = "https://textbelt.com/text"
TEXTBELT_API_KEY = os.getenv("TEXTBELT_API_KEY", "")

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users", response_model=User)
async def create_user(user: UserCreate):
    db_user = db.get_user_by_email(user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    user_data = {
        "type": "user",
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": hashed_password,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    user_id = db.create_user(user_data)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    return {
        "id": user_id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": True
    }

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.post("/sms/send", response_model=SMSResponse)
async def send_sms(sms: SMSMessage, current_user: User = Depends(get_current_active_user)):
    if not TEXTBELT_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="TextBelt API key not configured"
        )
    
    if not sms.recipients or len(sms.recipients) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one recipient is required"
        )
    
    recipient = sms.recipients[0].phone
    
    try:
        response = requests.post(
            TEXTBELT_API_URL,
            {
                "phone": recipient,
                "message": sms.message,
                "key": TEXTBELT_API_KEY
            }
        )
        
        data = response.json()
        
        message_data = {
            "type": "message",
            "user_id": current_user.id,
            "recipient": recipient,
            "message": sms.message,
            "success": data.get("success", False),
            "text_id": data.get("textId"),
            "error": data.get("error"),
            "sent_at": datetime.utcnow().isoformat()
        }
        
        db.save_message(message_data)
        
        return {
            "success": data.get("success", False),
            "message": data.get("message", "Unknown error"),
            "text_id": data.get("textId")
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to send SMS: {str(e)}",
            "text_id": None
        }

@app.post("/sms/bulk", response_model=SMSBatchResponse)
async def send_bulk_sms(sms: SMSMessage, current_user: User = Depends(get_current_active_user)):
    if not TEXTBELT_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="TextBelt API key not configured"
        )
    
    if not sms.recipients or len(sms.recipients) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one recipient is required"
        )
    
    results = []
    total_sent = 0
    total_failed = 0
    
    for recipient in sms.recipients:
        try:
            response = requests.post(
                TEXTBELT_API_URL,
                {
                    "phone": recipient.phone,
                    "message": sms.message,
                    "key": TEXTBELT_API_KEY
                }
            )
            
            data = response.json()
            success = data.get("success", False)
            
            if success:
                total_sent += 1
            else:
                total_failed += 1
            
            message_data = {
                "type": "message",
                "user_id": current_user.id,
                "recipient": recipient.phone,
                "message": sms.message,
                "success": success,
                "text_id": data.get("textId"),
                "error": data.get("error"),
                "sent_at": datetime.utcnow().isoformat()
            }
            
            db.save_message(message_data)
            
            results.append({
                "phone": recipient.phone,
                "success": success,
                "message": data.get("message", "Unknown error"),
                "text_id": data.get("textId")
            })
            
        except Exception as e:
            total_failed += 1
            results.append({
                "phone": recipient.phone,
                "success": False,
                "message": f"Failed to send SMS: {str(e)}",
                "text_id": None
            })
    
    return {
        "results": results,
        "total_sent": total_sent,
        "total_failed": total_failed
    }

@app.get("/pricing", response_model=List[PricingPlan])
async def get_pricing_plans():
    return [
        {
            "id": "basic",
            "name": "Basic",
            "price": 10.0,
            "description": "Perfect for individuals and small businesses just getting started with SMS marketing.",
            "features": [
                "1000 SMS credits per month",
                "Contact management",
                "Basic templates",
                "Email support"
            ]
        },
        {
            "id": "pro",
            "name": "Pro",
            "price": 20.0,
            "description": "Ideal for growing businesses with regular SMS marketing campaigns.",
            "features": [
                "2000 SMS credits per month",
                "Advanced analytics",
                "Campaign scheduling",
                "AI copywriting (100 prompts)",
                "Priority support"
            ]
        },
        {
            "id": "enterprise",
            "name": "Enterprise",
            "price": 40.0,
            "description": "For businesses with high-volume SMS marketing needs and custom requirements.",
            "features": [
                "4000 SMS credits per month",
                "Custom integrations",
                "Dedicated account manager",
                "Unlimited AI copywriting",
                "24/7 priority support"
            ]
        }
    ]
