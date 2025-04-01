import couchdb
from typing import Optional, Dict, Any, List
import os
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

COUCHDB_URL = os.getenv("COUCHDB_URL", "http://admin:password@localhost:5984/")
DB_NAME = "lightsms"

class Database:
    def __init__(self):
        self.server = None
        self.db = None
        self.connected = False
        self.in_memory_db = {}
        
        try:
            self.server = couchdb.Server(COUCHDB_URL)
            
            if DB_NAME not in self.server:
                self.db = self.server.create(DB_NAME)
                logger.info(f"Created database: {DB_NAME}")
            else:
                self.db = self.server[DB_NAME]
                logger.info(f"Connected to existing database: {DB_NAME}")
            
            self.connected = True
            logger.info("Successfully connected to CouchDB")
        except Exception as e:
            logger.warning(f"Failed to connect to CouchDB: {e}")
            logger.info("Using in-memory database as fallback")
            
            self.in_memory_db = {
                "users": {},
                "messages": {}
            }
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get a user by email"""
        if self.connected:
            try:
                results = self.db.view('users/by_email', key=email)
                for row in results:
                    return row.value
                return None
            except Exception as e:
                logger.error(f"Error querying CouchDB: {e}")
                return None
        else:
            for user_id, user in self.in_memory_db.get("users", {}).items():
                if user.get("email") == email:
                    return user
            return None
    
    def create_user(self, user_data: Dict[str, Any]) -> Optional[str]:
        """Create a new user"""
        if self.connected:
            try:
                doc_id, rev = self.db.save(user_data)
                return doc_id
            except Exception as e:
                logger.error(f"Error creating user in CouchDB: {e}")
                return None
        else:
            user_id = f"user_{len(self.in_memory_db.get('users', {})) + 1}"
            user_data["_id"] = user_id
            self.in_memory_db.setdefault("users", {})[user_id] = user_data
            return user_id
    
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user by ID"""
        if self.connected:
            try:
                return self.db.get(user_id)
            except Exception as e:
                logger.error(f"Error getting user from CouchDB: {e}")
                return None
        else:
            return self.in_memory_db.get("users", {}).get(user_id)
    
    def save_message(self, message_data: Dict[str, Any]) -> Optional[str]:
        """Save a message"""
        if self.connected:
            try:
                doc_id, rev = self.db.save(message_data)
                return doc_id
            except Exception as e:
                logger.error(f"Error saving message to CouchDB: {e}")
                return None
        else:
            message_id = f"msg_{len(self.in_memory_db.get('messages', {})) + 1}"
            message_data["_id"] = message_id
            self.in_memory_db.setdefault("messages", {})[message_id] = message_data
            return message_id
    
    def get_user_messages(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a user"""
        if self.connected:
            try:
                results = self.db.view('messages/by_user', key=user_id)
                return [row.value for row in results]
            except Exception as e:
                logger.error(f"Error getting messages from CouchDB: {e}")
                return []
        else:
            return [
                msg for msg in self.in_memory_db.get("messages", {}).values()
                if msg.get("user_id") == user_id
            ]

db = Database()

if db.connected:
    try:
        users_design = {
            "_id": "_design/users",
            "views": {
                "by_email": {
                    "map": "function(doc) { if (doc.type === 'user' && doc.email) { emit(doc.email, doc); } }"
                }
            }
        }
        
        messages_design = {
            "_id": "_design/messages",
            "views": {
                "by_user": {
                    "map": "function(doc) { if (doc.type === 'message' && doc.user_id) { emit(doc.user_id, doc); } }"
                }
            }
        }
        
        try:
            db.db.save(users_design)
        except couchdb.http.ResourceConflict:
            pass  # Design document already exists
            
        try:
            db.db.save(messages_design)
        except couchdb.http.ResourceConflict:
            pass  # Design document already exists
            
    except Exception as e:
        logger.error(f"Error creating CouchDB views: {e}")
