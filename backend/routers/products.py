from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from core.database import db
from core.security import get_current_user
from core.config import logger
from core.storage import delete_file as storage_delete_file
from models.product import Product, ProductCreate

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    for product in products:
        if isinstance(product.get("created_at"), str):
            product["created_at"] = datetime.fromisoformat(product["created_at"])
    return products


@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get("created_at"), str):
        product["created_at"] = datetime.fromisoformat(product["created_at"])
    return product


@router.post("", response_model=Product)
async def create_product(product: ProductCreate, current_user: str = Depends(get_current_user)):
    product_obj = Product(**product.model_dump())
    doc = product_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.products.insert_one(doc)
    return product_obj


@router.put("/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate, current_user: str = Depends(get_current_user)):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    # Delete old images from MinIO if replaced
    fields_to_check = [
        ("image_url", product.image_url),
        ("preview_light_url", product.preview_light_url),
        ("preview_dark_url", product.preview_dark_url),
    ]
    for field, new_val in fields_to_check:
        old_val = existing.get(field)
        if old_val and new_val != old_val:
            try:
                storage_delete_file(old_val)
            except Exception as e:
                logger.warning(f"Could not delete old product file ({field}): {e}")

    update_data = product.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update_data})

    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return updated


@router.delete("/{product_id}")
async def delete_product(product_id: str, current_user: str = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Clean up all associated images from MinIO
    for field in ["image_url", "preview_light_url", "preview_dark_url"]:
        url = product.get(field)
        if url:
            try:
                storage_delete_file(url)
            except Exception as e:
                logger.warning(f"Could not delete product file ({field}): {e}")

    await db.products.delete_one({"id": product_id})
    return {"message": "Product and associated files deleted successfully"}
