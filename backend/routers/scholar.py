from fastapi import APIRouter, HTTPException, Depends
from core.rate_limiter import scholar_rate_limiter
from scholar_scraper import scrape_publications

router = APIRouter(prefix="/scholar", tags=["Google Scholar"])

@router.get("/publications", dependencies=[Depends(scholar_rate_limiter)])
async def get_scholar_publications(url: str):
    """
    Fetch publications from a Google Scholar profile.
    Protected against SSRF and rate-limited to 10 requests per minute per IP.
    """
    try:
        publications = await scrape_publications(url)
        return publications
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail="Terjadi kegagalan saat mengambil data publikasi dari Google Scholar."
        )
