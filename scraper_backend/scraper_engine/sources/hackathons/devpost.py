import httpx
from typing import List, Dict, Any
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from core.base_scraper import BaseScraper

class DevpostScraper(BaseScraper):
    source_name = "Devpost"
    category = "hackathon"

    def __init__(self, use_proxy: bool = False):
        super().__init__(use_proxy)
        # Using Devpost's internal search JSON API rather than parsing raw HTML
        self.api_url = "https://devpost.com/api/hackathons?status[]=upcoming&status[]=open"

    async def fetch_page(self, url: str) -> Any:
        # url parameter is ignored as we use the dedicated api_url
        headers = {
            "Accept": "application/json",
            "User-Agent": "YuvahubOpportunityBot/1.0"
        }
        transport = httpx.AsyncHTTPTransport(retries=3)
        async with httpx.AsyncClient(transport=transport, headers=headers, timeout=15.0, proxies=self.proxies) as client:
            response = await client.get(self.api_url, follow_redirects=True)
            response.raise_for_status()
            return response.json()

    async def parse(self, data: Any) -> List[Dict[str, Any]]:
        hackathons = []
        hackathon_list = data.get("hackathons", [])
        
        for item in hackathon_list:
            hackathons.append({
                "title": item.get("title"),
                "organization": item.get("organization_name", "Devpost Community"),
                "apply_link": item.get("url"),
                "deadline": item.get("submission_period_dates"),
                "tags": [t.get("name") for t in item.get("themes", [])],
                "description": item.get("displayed_location", {}).get("location", "Global Online Hackathon"),
                "prize_pool": item.get("prize_amount"),
                "mode": "online" if "Online" in item.get("displayed_location", {}).get("location", "") else "hybrid"
            })
            
        return hackathons
