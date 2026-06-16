# Opportunity Aggregation Pipeline

This document explains the architecture implemented for YuvaHub:

## 1. Python Scheduler & Scraping Pipeline (\`/scraper/pipeline.py\`)
- **100+ Sources**: Mocked entry points for sources like YCombinator, Greenhouse, Lever, etc.
- **Central Registry**: \`CentralScraperRegistry\` manages execution.
- **Normalization**: \`normalize()\` standardizes JSON keys.
- **Deduplication**: \`deduplicate()\` collapses redundant listings.
- **AI Tag Cleaner**: \`ai_tag_cleaner()\` standardizes tags before database entry.
- **MongoDB**: Upserts to the MongoDB \`opportunities\` collection.

## 2. Ranking Engine & Node API (\`/server.ts\`)
- **Node API**: Express framework parsing frontend queries.
- **Ranking Engine**: \`getRankedOpportunities()\` merges engagement metrics (clicks/saves from the \`interactions\` collection) natively sorting them by temporal relevance.

## 3. Frontend & Feed (\`/src/components/Tabs/Opportunities.tsx\`)
- **User Feed**: Rendered using a highly responsive React/Tailwind UI pipeline.
- **AI Search Enhancement**: Fast context filtering capabilities.

## 4. Gemini Fallback (\`/src/services/apiClient.ts\`)
- **Fallback Mechanism**: \`getSmartFeed()\` and Search query Gemini 3.5 Flash directly if the standard database ranking yields insufficient results.
- Mapped inline into the frontend dataset with \`isAI_Supplement: true\`.
