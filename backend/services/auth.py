from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from ..models.user import UserProfile, UserCreate, UserUpdate

class AuthService:
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        self.users_collection = db.users
    
    async def create_user(self, user_data: UserCreate) -> UserProfile:
        """Create a new user"""
        # Check if user already exists
        existing_user = await self.users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise ValueError("User with this email already exists")
        
        user = UserProfile(**user_data.dict())
        await self.users_collection.insert_one(user.dict())
        return user
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserProfile]:
        """Get user by ID"""
        user_data = await self.users_collection.find_one({"id": user_id})
        if user_data:
            return UserProfile(**user_data)
        return None
    
    async def get_user_by_email(self, email: str) -> Optional[UserProfile]:
        """Get user by email"""
        user_data = await self.users_collection.find_one({"email": email})
        if user_data:
            return UserProfile(**user_data)
        return None
    
    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[UserProfile]:
        """Update user profile"""
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        if not update_data:
            return await self.get_user_by_id(user_id)
        
        update_data["updated_at"] = datetime.utcnow()
        
        await self.users_collection.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        return await self.get_user_by_id(user_id)