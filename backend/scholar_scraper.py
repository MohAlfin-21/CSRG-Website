import re
from typing import List, Dict, Any
from urllib.parse import urlparse, parse_qs
import httpx
from bs4 import BeautifulSoup
from core.config import logger

SCHOLAR_USER_REGEX = re.compile(r"^[a-zA-Z0-9_-]{8,32}$")
SCHOLAR_HOST_REGEX = re.compile(r"^scholar\.google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$", re.IGNORECASE)

def extract_scholar_id(url: str) -> str:
    """Extract and strictly validate Google Scholar user ID from URL."""
    if not url:
        raise ValueError("URL Google Scholar tidak boleh kosong.")
    
    parsed = urlparse(url.strip())
    if parsed.scheme != "https":
        raise ValueError("URL harus menggunakan protokol HTTPS.")
    
    netloc = parsed.netloc.lower().split(":")[0]
    if not SCHOLAR_HOST_REGEX.match(netloc):
        raise ValueError("Domain bukan domain resmi Google Scholar.")
    
    query_params = parse_qs(parsed.query)
    user_param = query_params.get("user")
    if not user_param or not user_param[0]:
        raise ValueError("Parameter 'user' tidak ditemukan pada URL Google Scholar.")
    
    scholar_id = user_param[0].strip()
    if not SCHOLAR_USER_REGEX.match(scholar_id):
        raise ValueError("Format Google Scholar User ID tidak valid.")
    
    return scholar_id


async def scrape_publications(scholar_url: str) -> List[Dict[str, Any]]:
    """
    Scrape publications safely from a Google Scholar profile using httpx.
    Validates the URL to prevent SSRF and blocks internal network access.
    """
    scholar_id = extract_scholar_id(scholar_url)

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }

    target_url = f"https://scholar.google.com/citations?user={scholar_id}&hl=en"

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(target_url, headers=headers)
            response.raise_for_status()
            html_text = response.text
    except httpx.HTTPStatusError as e:
        logger.warning(f"Google Scholar returned error status {e.response.status_code} for user {scholar_id}")
        raise ValueError(f"Gagal mengambil profil Google Scholar: status {e.response.status_code}")
    except httpx.RequestError as e:
        logger.error(f"Network error connecting to Google Scholar: {e}")
        raise ValueError("Gagal menghubungi server Google Scholar.")

    soup = BeautifulSoup(html_text, "html.parser")
    publications = []

    for paper in soup.find_all("tr", class_="gsc_a_tr"):
        title_elem = paper.find("a", class_="gsc_a_at")
        if not title_elem:
            continue

        authors_elem = paper.find("div", class_="gs_gray")
        pub_elem = paper.find_all("div", class_="gs_gray")
        year_elem = paper.find("span", class_="gsc_a_h")
        citations_elem = paper.find("a", class_="gsc_a_ac")

        publication = {
            "title": title_elem.get_text(strip=True),
            "authors": authors_elem.get_text(strip=True) if authors_elem else "",
            "publication": pub_elem[1].get_text(strip=True) if len(pub_elem) > 1 else "",
            "year": year_elem.get_text(strip=True) if year_elem else "",
            "citations": citations_elem.get_text(strip=True) if citations_elem else "0",
            "link": f"https://scholar.google.com{title_elem['href']}" if title_elem.has_attr("href") else None,
        }
        publications.append(publication)

    return publications[:100]