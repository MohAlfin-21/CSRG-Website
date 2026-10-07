from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from core.database import db
from core.security import get_current_user
from core.config import PHOTOS_DIR, logger
from models.news import NewsArticle, NewsCreate

router = APIRouter(prefix="/news", tags=["News"])

@router.get("", response_model=List[NewsArticle])
async def get_news():
    news = await db.news.find({}, {"_id": 0}).sort("published_date", -1).to_list(1000)
    for article in news:
        if isinstance(article.get("published_date"), str):
            article["published_date"] = datetime.fromisoformat(article["published_date"])
        if isinstance(article.get("created_at"), str):
            article["created_at"] = datetime.fromisoformat(article["created_at"])
    return news

@router.get("/{news_id}", response_model=NewsArticle)
async def get_news_article(news_id: str):
    article = await db.news.find_one({"id": news_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="News article not found")
    if isinstance(article.get("published_date"), str):
        article["published_date"] = datetime.fromisoformat(article["published_date"])
    if isinstance(article.get("created_at"), str):
        article["created_at"] = datetime.fromisoformat(article["created_at"])
    return article

@router.post("", response_model=NewsArticle)
async def create_news(news: NewsCreate, current_user: str = Depends(get_current_user)):
    news_obj = NewsArticle(**news.model_dump())
    doc = news_obj.model_dump()
    doc["published_date"] = doc["published_date"].isoformat()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.news.insert_one(doc)
    return news_obj

@router.put("/{news_id}", response_model=NewsArticle)
async def update_news(news_id: str, news: NewsCreate, current_user: str = Depends(get_current_user)):
    existing_news = await db.news.find_one({"id": news_id})
    if not existing_news:
        raise HTTPException(status_code=404, detail="News article not found")
    
    # Delete old thumbnail if new thumbnail is provided
    if news.thumbnail_url != existing_news.get("thumbnail_url") and existing_news.get("thumbnail_filename"):
        try:
            thumbnail_path = PHOTOS_DIR / existing_news["thumbnail_filename"]
            if thumbnail_path.exists():
                thumbnail_path.unlink()
        except Exception as e:
            logger.warning(f"Could not delete old news thumbnail: {str(e)}")
    
    update_data = news.model_dump()
    await db.news.update_one({"id": news_id}, {"$set": update_data})
    
    updated_news = await db.news.find_one({"id": news_id}, {"_id": 0})
    if isinstance(updated_news.get("published_date"), str):
        updated_news["published_date"] = datetime.fromisoformat(updated_news["published_date"])
    if isinstance(updated_news.get("created_at"), str):
        updated_news["created_at"] = datetime.fromisoformat(updated_news["created_at"])
    return updated_news

@router.delete("/{news_id}")
async def delete_news(news_id: str, current_user: str = Depends(get_current_user)):
    news = await db.news.find_one({"id": news_id})
    if not news:
        raise HTTPException(status_code=404, detail="News article not found")

    if news.get("thumbnail_filename"):
        try:
            thumbnail_path = PHOTOS_DIR / news["thumbnail_filename"]
            if thumbnail_path.exists():
                thumbnail_path.unlink()
        except Exception as e:
            logger.warning(f"Could not delete news thumbnail: {str(e)}")

    await db.news.delete_one({"id": news_id})
    return {"message": "News article and associated thumbnail deleted successfully"}
