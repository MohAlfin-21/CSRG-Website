from routers.auth import router as auth_router
from routers.members import router as members_router
from routers.news import router as news_router
from routers.contact import router as contact_router
from routers.scholar import router as scholar_router
from routers.files import router as files_router
from routers.products import router as products_router

__all__ = [
    "auth_router",
    "members_router",
    "news_router",
    "contact_router",
    "scholar_router",
    "files_router",
    "products_router",
]
