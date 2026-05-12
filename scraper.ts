import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export async function runScrapers() {
  const uri = process.env.MONGODB_URI || "";
  const dbName = process.env.MONGODB_DB_NAME || "yuvahub";
  
  if (!uri) {
    console.warn("No MONGODB_URI for scraper");
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    console.log("[Scraper] Starting collection...");
    
    // Devfolio Hackathons (simple fetch replacing python version)
    const resp = await fetch("https://api.devfolio.co/api/hackathons?filter=all");
    if (resp.ok) {
      const data = await resp.json();
      const results = (data.hits || []).map((h: any) => {
        const title = h._source?.name || "Unknown Hackathon";
        const fp = crypto.createHash("md5").update("devfolio-" + title).digest("hex");
        return {
          title,
          organization: h._source?.host || "Devfolio",
          apply_link: h._source?.url || "https://devfolio.co",
          tags: (h._source?.tags || []).slice(0, 3),
          type: "hackathon",
          source: "devfolio",
          fingerprint: fp,
          created_at: new Date()
        };
      });
      
      let inserted = 0;
      for (const r of results) {
         const res = await db.collection("opportunities").updateOne(
           { fingerprint: r.fingerprint },
           { $setOnInsert: r },
           { upsert: true }
         );
         if (res.upsertedCount > 0) inserted++;
      }
      console.log(`[Scraper] Devfolio added ${inserted} items.`);
    }

    // Devpost Hackathons
    const dpresp = await fetch("https://devpost.com/api/hackathons");
    if (dpresp.ok) {
        const dpdata = await dpresp.json();
        const results = (dpdata.hackathons || []).map((h: any) => {
            const title = h.title || "Unknown";
            const fp = crypto.createHash("md5").update("devpost-" + title).digest("hex");
            return {
                title,
                organization: h.organization_name || "Devpost",
                apply_link: h.url || "https://devpost.com",
                tags: (h.submission_period_tags || []).map((t: any) => t.name).slice(0, 3),
                type: "hackathon",
                source: "devpost",
                fingerprint: fp,
                created_at: new Date(),
                deadline: h.submission_period_ends_at
            }
        });
        let inserted = 0;
        for (const r of results) {
            const res = await db.collection("opportunities").updateOne(
            { fingerprint: r.fingerprint },
            { $setOnInsert: r },
            { upsert: true }
            );
            if (res.upsertedCount > 0) inserted++;
        }
        console.log(`[Scraper] Devpost added ${inserted} items.`);
    }

    console.log("[Scraper] Completed collection run.");
  } catch(e) {
    console.error("[Scraper] Error:", e);
  } finally {
    await client.close();
  }
}
