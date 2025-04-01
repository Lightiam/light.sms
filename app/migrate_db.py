import os
import logging
from database import db as couchdb
from database_pg import db_pg, User, Contact, ContactGroup, MessageTemplate, Campaign, SmsMessage
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_users():
    """Migrate users from CouchDB to PostgreSQL"""
    logger.info("Migrating users...")
    
    
    if not couchdb.connected:
        logger.warning("CouchDB not connected, skipping user migration")
        return
    
    try:
        user_ids = ["user_1", "user_2"]  # Replace with actual user IDs
        
        for user_id in user_ids:
            user_data = couchdb.get_user(user_id)
            if user_data:
                pg_user_id = db_pg.create_user({
                    "email": user_data.get("email"),
                    "password_hash": user_data.get("hashed_password"),
                    "first_name": user_data.get("full_name", "").split(" ")[0] if user_data.get("full_name") else None,
                    "last_name": " ".join(user_data.get("full_name", "").split(" ")[1:]) if user_data.get("full_name") and len(user_data.get("full_name", "").split(" ")) > 1 else None,
                    "organization": user_data.get("organization")
                })
                logger.info(f"Migrated user {user_id} to PostgreSQL with ID {pg_user_id}")
    except Exception as e:
        logger.error(f"Error migrating users: {e}")

def migrate_messages():
    """Migrate messages from CouchDB to PostgreSQL"""
    logger.info("Migrating messages...")
    
    if not couchdb.connected:
        logger.warning("CouchDB not connected, skipping message migration")
        return
    
    try:
        user_ids = ["user_1", "user_2"]  # Replace with actual user IDs
        
        for user_id in user_ids:
            messages = couchdb.get_user_messages(user_id)
            
            for message in messages:
                
                contact_id = db_pg.create_contact({
                    "user_id": user_id,
                    "phone_number": message.get("recipient"),
                    "first_name": "Migrated",
                    "last_name": "Contact"
                })
                
                campaign_id = db_pg.create_campaign({
                    "user_id": user_id,
                    "name": "Migrated Campaign",
                    "message": message.get("message"),
                    "status": "completed"
                })
                
                pg_message_id = db_pg.save_message({
                    "campaign_id": campaign_id,
                    "contact_id": contact_id,
                    "message_content": message.get("message"),
                    "status": "delivered" if message.get("success") else "failed",
                    "error_message": message.get("error"),
                    "external_id": message.get("text_id"),
                    "sent_at": datetime.fromisoformat(message.get("sent_at")) if message.get("sent_at") else None,
                    "delivered_at": None,  # No delivery status in CouchDB
                    "delivery_status": None  # No delivery status in CouchDB
                })
                
                logger.info(f"Migrated message {message.get('_id')} to PostgreSQL with ID {pg_message_id}")
    except Exception as e:
        logger.error(f"Error migrating messages: {e}")

def run_migration():
    """Run the migration from CouchDB to PostgreSQL"""
    logger.info("Starting migration from CouchDB to PostgreSQL...")
    
    if not db_pg.connected:
        logger.error("PostgreSQL not connected, aborting migration")
        return
    
    migrate_users()
    
    migrate_messages()
    
    logger.info("Migration completed")

if __name__ == "__main__":
    run_migration()
