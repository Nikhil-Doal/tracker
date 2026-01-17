// Database configuration constants
const DB_NAME = "browser_telemetry";
const DB_VERSION = 1;
const STORE_NAME = "events";

// Cache promise to reuse existing database connection
let dbPromise = null;

// Opens IndexedDB connection with schema initialization
function openDB() {
  // Return cached promise if database already opened
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    // Initiate database open request
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Handle schema upgrade when needed
    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "_id",
        });

        // Create indexes for querying by timestamp and type
        store.createIndex("ts", "ts", { unique: false });
        store.createIndex("type", "type", { unique: false });
      }
    };

    // Resolve promise with database instance on success
    request.onsuccess = () => resolve(request.result);
    // Reject promise if database opening fails
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Stores an event in the database
export async function writeEvent(event) {
  // Get database connection
  const db = await openDB();

  return new Promise((resolve, reject) => {
    // Create read-write transaction on events store
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Add event to store
    store.add(event);

    // Resolve on transaction completion
    tx.oncomplete = () => resolve();
    // Reject if transaction fails
    tx.onerror = () => reject(tx.error);
  });
}

// Retrieves all events from the database
export async function getAllEvents() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Retrieves events within a time range
export async function getEventsByTimeRange(startTs, endTs) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("ts");

    const range = IDBKeyRange.bound(startTs, endTs);
    const request = index.getAll(range);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Deletes events by their IDs
export async function deleteEvents(eventIds) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Delete each event by ID
    eventIds.forEach((id) => store.delete(id));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Gets count of events in database
export async function getEventCount() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Clears all events from the database (useful for testing)
export async function clearAllEvents() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const request = store.clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
