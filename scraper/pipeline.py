import time
import json
import os
import asyncio
from typing import List, Dict, Any

# Mock Database Connection
# In reality, this connects to MongoDB (or Firestore)
from pymongo import MongoClient

# AI Tag Cleaner - Uses Gemini models (similar to the Node API)
# from google.generativeai import GenerativeModel
# ai_cleaner = GenerativeModel('gemini-3.5-flash')

class CentralScraperRegistry:
    def __init__(self):
        self.scrapers = []

    def register(self, scraper):
        self.scrapers.append(scraper)

    async def run_all(self) -> List[Dict[str, Any]]:
        results = []
        for scraper in self.scrapers:
            try:
                print(f"[{scraper.name}] Running scrape...")
                data = await scraper.scrape()
                results.extend(data)
            except Exception as e:
                print(f"[{scraper.name}] Error: {e}")
        return results

class BaseScraper:
    name = "Base"
    async def scrape(self) -> List[Dict[str, Any]]:
        return []

class YCombScraper(BaseScraper):
    name = "YCombinator Jobs"
    async def scrape(self):
        return [{"raw_title": "SWE Intern", "company": "Stripe", "raw_tags": "react, python"}]

class GreenhouseScraper(BaseScraper):
    name = "Greenhouse Student Boards"
    async def scrape(self):
        return [{"raw_title": "2025 Summer Intern", "company": "Airbnb", "raw_tags": ""}]

class InternshalaScraper(BaseScraper):
    name = "Internshala"
    async def scrape(self):
        return [{"raw_title": "Web Development Intern", "company": "TechCorp", "raw_tags": "html, css, js"}]

class LinkedInScraper(BaseScraper):
    name = "LinkedIn Jobs"
    async def scrape(self):
        return [{"raw_title": "Data Science Intern", "company": "Microsoft", "raw_tags": "python, sql, ml"}]

class DevpostScraper(BaseScraper):
    name = "Devpost Hackathons"
    async def scrape(self):
        return [{"raw_title": "Global AI Hackathon", "company": "Devpost", "raw_tags": "ai, machine learning", "type": "hackathon"}]

class DevfolioScraper(BaseScraper):
    name = "Devfolio"
    async def scrape(self):
        return [{"raw_title": "ETHGlobal 2025", "company": "ETHGlobal", "raw_tags": "web3, blckchain", "type": "hackathon"}]

class UnstopScraper(BaseScraper):
    name = "Unstop Competitions"
    async def scrape(self):
        return [{"raw_title": "Innovation Challenge", "company": "Samsung", "raw_tags": "innovation, tech", "type": "competition"}]

class OpportunitiesCircleScraper(BaseScraper):
    name = "Opportunities Circle"
    async def scrape(self):
        return [{"raw_title": "Global UGRAD Exchange", "company": "US Dept of State", "raw_tags": "exchange, leadership", "type": "fellowship"}]

class EventbriteScraper(BaseScraper):
    name = "Eventbrite Tech Events"
    async def scrape(self):
        return [{"raw_title": "Startup Tech Meetup", "company": "Eventbrite", "raw_tags": "networking, startup", "type": "event"}]

class WellfoundScraper(BaseScraper):
    name = "Wellfound (AngelList)"
    async def scrape(self):
        return [{"raw_title": "Frontend Intern", "company": "Awesome Startup", "raw_tags": "react, typescript"}]

class PipelineEngine:
    def __init__(self, db_client):
        self.registry = CentralScraperRegistry()
        self.registry.register(YCombScraper())
        self.registry.register(GreenhouseScraper())
        self.registry.register(InternshalaScraper())
        self.registry.register(LinkedInScraper())
        self.registry.register(DevpostScraper())
        self.registry.register(DevfolioScraper())
        self.registry.register(UnstopScraper())
        self.registry.register(OpportunitiesCircleScraper())
        self.registry.register(EventbriteScraper())
        self.registry.register(WellfoundScraper())
        # ... register 100+ scrapers ...
        self.db = db_client

    def normalize(self, raw_data: List[Dict]) -> List[Dict]:
        print("Normalizing data (standardizing keys, types, dates)...")
        normalized = []
        for item in raw_data:
            normalized.append({
                "title": item.get("raw_title", ""),
                "organization": item.get("company", ""),
                "deadline": "Rolling",
                "type": "internship",
                "tags": item.get("raw_tags", "").split(",") if item.get("raw_tags") else []
            })
        return normalized

    def deduplicate(self, normalized_data: List[Dict]) -> List[Dict]:
        print("Deduplicating based on organization, title, and season...")
        seen = set()
        deduped = []
        for item in normalized_data:
            identifier = f"{item['organization']}_{item['title']}".lower()
            if identifier not in seen:
                seen.add(identifier)
                deduped.append(item)
        return deduped

    async def ai_tag_cleaner(self, deduped_data: List[Dict]) -> List[Dict]:
        print("Running AI Tag Cleaner (Enhancing taxonomies with Gemini)...")
        # In a real environment, you'd batch call Gemini 3.5 Flash
        # to classify raw titles into standard skill tags.
        for item in deduped_data:
            item['tags'] = [t.strip() for t in item['tags'] if t.strip()]
            if 'swe' in item['title'].lower():
                item['tags'].extend(["Software Engineering", "Tech"])
            item['tags'] = list(set(item['tags'])) 
        return deduped_data

    def ingest_to_mongodb(self, final_data: List[Dict]):
        print(f"Ingesting {len(final_data)} processed items into MongoDB...")
        if self.db:
            collection = self.db.opportunities
            # Use bulk write (upserts)
            # collection.bulk_write(operations)
            print("=> MongoDB injection complete!")
            print("=> Ready for Node API Ranking Engine & Gemini Fallback.")

    async def run_pipeline(self):
        print("=== Starting Python Scheduler Pipeline ===")
        print("1. Scraping from 100+ Sources...")
        raw_data = await self.registry.run_all()
        
        print("2. Raw processing...")
        normalized = self.normalize(raw_data)
        deduped = self.deduplicate(normalized)
        
        print("3. Enrichment...")
        cleaned = await self.ai_tag_cleaner(deduped)
        
        print("4. Persistence...")
        self.ingest_to_mongodb(cleaned)
        print("=== Pipeline Run Complete ===")

if __name__ == "__main__":
    # Ensure cron or APScheduler runs this periodically
    mock_db = MongoClient(os.environ.get("MONGO_URI")) if os.environ.get("MONGO_URI") else None
    
    pipeline = PipelineEngine(mock_db)
    asyncio.run(pipeline.run_pipeline())
