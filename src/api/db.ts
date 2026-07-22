import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { CURATED_FALLBACKS } from "../services/staticFallbacks.js";
import { initializeDNLDatabase } from "../services/dnl/metrics.js";
import { DNLDispatcher } from "../services/dnl/scheduler.js";
import { DevpostAdapter } from "../services/dnl/adapters/DevpostAdapter.js";
import { InternshalaAdapter } from "../services/dnl/adapters/InternshalaAdapter.js";
import { initializeSearchSync } from "../services/searchSync.js";

dotenv.config();

const uri = process.env.MONGODB_URI || "";
const commandUri = process.env.MONGODB_COMMAND_URI || uri;
const queryUri = process.env.MONGODB_QUERY_URI || uri;
const dbName = process.env.MONGODB_DB_NAME || "yuvahub";

export let dbCommand: any = null;
export let dbQuery: any = null;

// VERY simple mock DB for offline fallback
export class MemoryCollection {
  data: any[];
  constructor(initialData: any[] = []) { this.data = initialData; }
  find(query: any = {}) {
    let result = this.data;
    for (const key in query) {
      if (key === 'id') {
        result = result.filter(r => r.id === query.id || r._id === query.id || r._id?.toString() === query.id);
      } else if (key === '_id') {
        result = result.filter(r => r.id === query._id.toString() || r._id?.toString() === query._id.toString() || r.id === query._id);
      } else if (key === '$text') {
        result = result.filter(r => JSON.stringify(r).toLowerCase().includes(query.$text.$search.toLowerCase()));
      } else if (key === '$or') {
        result = result.filter(r => {
          return query.$or.some((cond: any) => {
            for (let k in cond) {
              if (cond[k].$regex) {
                const regex = new RegExp(cond[k].$regex, cond[k].$options || "");
                if (regex.test(r[k])) return true;
              } else {
                if (r[k] === cond[k]) return true;
              }
            }
            return false;
          });
        });
      } else {
        // Generic key-value match
        result = result.filter(r => r[key] === query[key]);
      }
    }

    const cursor = {
      sort: () => cursor,
      limit: (n: number) => { result = result.slice(0, n); return cursor; },
      toArray: async () => result
    };
    return cursor;
  }
  async findOne(query: any) {
    const res = await this.find(query).toArray();
    return res[0] || null;
  }
  async updateOne(query: any, update: any, options: any = {}) {
    const item = await this.findOne(query);
    if (item) {
      if (update.$set) {
        Object.assign(item, update.$set);
      }
      if (update.$addToSet) {
        for (const key in update.$addToSet) {
          if (!Array.isArray(item[key])) {
            item[key] = [];
          }
          const val = update.$addToSet[key];
          if (!item[key].includes(val)) {
            item[key].push(val);
          }
        }
      }
      if (update.$pull) {
        for (const key in update.$pull) {
          if (Array.isArray(item[key])) {
            const val = update.$pull[key];
            item[key] = item[key].filter((x: any) => x !== val);
          }
        }
      }
      return { modifiedCount: 1 };
    }
    if (options.upsert) {
      const doc = { ...query };
      if (update.$set) Object.assign(doc, update.$set);
      this.data.push(doc);
      return { upsertedCount: 1, upsertedId: "mock_upsert_id" };
    }
    return { modifiedCount: 0 };
  }
  async insertOne(doc: any) { this.data.push(doc); return { insertedId: "mock_id" }; }
  async deleteOne(query: any) {
    const initialLen = this.data.length;
    const item = await this.findOne(query);
    if (item) {
      this.data = this.data.filter(r => r !== item);
    }
    return { deletedCount: this.data.length < initialLen ? 1 : 0 };
  }
  async countDocuments() { return this.data.length; }
  async createIndex(keys: any, options: any) { return "mock_index"; }
  aggregate() { return { toArray: async () => [] }; }
  initializeUnorderedBulkOp() {
    const ops: any[] = [];
    return {
      insert: (doc: any) => {
        ops.push(doc);
      },
      execute: async () => {
        this.data.push(...ops);
        return { ok: 1, nInserted: ops.length };
      }
    };
  }
}

export class MockDB {
  isMock = true;
  collections: Record<string, MemoryCollection> = {
    opportunities: new MemoryCollection(CURATED_FALLBACKS.map(f => ({ ...f, created_at: new Date() }))),
    interactions: new MemoryCollection(),
    scraper_metrics: new MemoryCollection()
  };
  collection(name: string) { return this.collections[name] || (this.collections[name] = new MemoryCollection()); }
}

function setupDNL(database: any) {
  initializeDNLDatabase(database).then(() => {
    const dispatcher = new DNLDispatcher(database);
    dispatcher.registerAdapter(new DevpostAdapter());
    dispatcher.registerAdapter(new InternshalaAdapter());
    dispatcher.start(3600000); // 1 hour
    console.log("[DNL] Scheduler initialized and started.");
  }).catch(err => {
    console.error("[DNL] Setup failed:", err);
  });
}

export async function initializeDatabase(): Promise<void> {
  if (commandUri && queryUri) {
    const commandClient = new MongoClient(commandUri);
    const queryClient = new MongoClient(queryUri);

    try {
      await Promise.all([commandClient.connect(), queryClient.connect()]);
      dbCommand = commandClient.db(process.env.MONGODB_COMMAND_DB || dbName);
      dbQuery = queryClient.db(process.env.MONGODB_QUERY_DB || dbName);
      console.log(`[Database] Connected to Command and Query MongoDB pools`);
      setupDNL(dbCommand);
      initializeSearchSync(dbQuery).catch(err => console.error('[SearchSync] Non-fatal init error:', err));

      dbCommand.collection("opportunities").createIndex({ created_at: -1, source_quality_score: -1 })
        .then(() => console.log(`[Database] Created compound index on opportunities`))
        .catch((err: any) => console.error(`[Database] Failed to create index:`, err));

      dbQuery.collection("users").createIndex({ uid: 1 }, { unique: true })
        .then(() => console.log(`[Database] Created unique index on users.uid`))
        .catch((err: any) => console.error(`[Database] Failed to create index on users.uid:`, err));
      dbCommand.collection("users").createIndex({ firebaseUid: 1 }, { unique: true, sparse: true })
        .then(() => console.log(`[Database] Created unique sparse index on users.firebaseUid`))
        .catch((err: any) => console.error(`[Database] Failed to create unique index:`, err));
    } catch (err) {
      console.error("[Database] Connection failed, falling back to Mock Data:", err);
      dbCommand = new MockDB();
      dbQuery = new MockDB();
      setupDNL(dbCommand);
      initializeSearchSync(dbQuery).catch(err => console.error('[SearchSync] Non-fatal init error:', err));
    }
  } else {
    console.log("[Database] No MONGODB_URI provided. Running in Offline Mock mode.");
    dbCommand = new MockDB();
    dbQuery = new MockDB();
    setupDNL(dbCommand);
    initializeSearchSync(dbQuery).catch(err => console.error('[SearchSync] Non-fatal init error:', err));
  }
}
