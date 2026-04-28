import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

client = AsyncIOMotorClient(MONGO_URI)
db = client.diet_app
users_collection = db.users
predictions_collection = db.predictions
food_logs_collection = db.food_logs # NEW: Collection for tracking daily meals