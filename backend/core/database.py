from motor.motor_asyncio import AsyncIOMotorClient
from core.config import MONGO_URL, DB_NAME, logger

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    client.close()
