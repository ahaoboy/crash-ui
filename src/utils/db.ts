// IndexedDB store for per-minute data usage logs — ported verbosely.
export interface DataUsageLog {
  id?: number;
  timestamp: number;
  sourceIP: string;
  host: string;
  outbound: string;
  process: string;
  inboundUser: string;
  upload: number;
  download: number;
}

const DB_NAME = "metacubexd_db";
const STORE_NAME = "data_usage_logs";
const DB_VERSION = 1;

export class DataUsageDB {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (typeof indexedDB === "undefined") {
      return Promise.reject(new Error("IndexedDB is not available"));
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("sourceIP", "sourceIP", { unique: false });
          store.createIndex("host", "host", { unique: false });
          store.createIndex("outbound", "outbound", { unique: false });
          store.createIndex("process", "process", { unique: false });
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      request.onerror = () => reject((request as IDBOpenDBRequest).error);
    });
  }

  async addLogs(logs: DataUsageLog[]): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const log of logs) store.add(log);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async query(startTime: number, endTime: number): Promise<DataUsageLog[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], "readonly");
      const idx = tx.objectStore(STORE_NAME).index("timestamp");
      const range = IDBKeyRange.bound(startTime, endTime);
      const request = idx.openCursor(range);
      const results: DataUsageLog[] = [];
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          results.push({ ...cursor.value, inboundUser: cursor.value.inboundUser || "Unknown" });
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], "readwrite");
      const request = tx.objectStore(STORE_NAME).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cleanup(beforeTime: number): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const idx = store.index("timestamp");
      const range = IDBKeyRange.upperBound(beforeTime);
      const request = idx.openKeyCursor(range);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const db = new DataUsageDB();
