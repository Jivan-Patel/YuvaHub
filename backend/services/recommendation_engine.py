import time
import logging

class RecommendationEngine:
    """
    Mock class representing the core feed scoring engine inside the FastAPI Backend.
    """
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    async def get_personalized_feed(self, user_id: str, page: int, limit: int):
        """
        In production, this would:
        1. Fetch user interest vectors (tags, interaction history).
        2. Query MongoDB with Aggregation / Vector Search.
        3. Sort by 'match_score'.
        """
        # Simulating DB latency
        
        return {
            "num_results": 2,
            "next_page": page + 1 if page < 5 else None,
            "items": [
                {
                    "id": f"opp_101_user_{user_id}_pg_{page}",
                    "title": "Backend Engineering Intern",
                    "organization": "FastAPI Corp",
                    "type": "internship",
                    "tags": ["python", "backend"],
                    "apply_link": "https://example.com/apply"
                },
                {
                    "id": f"opp_102_user_{user_id}_pg_{page}",
                    "title": "Global AI Hackathon",
                    "organization": "OpenAI",
                    "type": "hackathon",
                    "tags": ["ai", "competition"],
                    "apply_link": "https://example.com/openai"
                }
            ]
        }

    async def get_trending_feed(self, page: int, limit: int):
        return {
            "num_results": 1,
            "next_page": page + 1 if page < 3 else None,
            "items": [
                {
                    "id": f"opp_trending_1",
                    "title": "Most Saved Internship",
                    "organization": "Google",
                    "type": "internship",
                    "tags": ["software engineering"],
                    "apply_link": "https://careers.google.com"
                }
            ]
        }

    def get_fallback_feed(self):
        """
        Tier 5 Fallback (when DB / Cache are totally down).
        """
        return [
            {
                "id": "fallback_1",
                "title": "SDE Intern (Fallback)",
                "organization": "Amazon",
                "type": "internship",
                "tags": ["software engineering"],
                "apply_link": "https://amazon.jobs"
            }
        ]
