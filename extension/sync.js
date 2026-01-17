import { getAllEvents, deleteEvents } from "./db.js";

// Configuration
const API_BASE_URL = "http://localhost:5000/api"; // Update this when you have your backend running
const SYNC_BATCH_SIZE = 100; // Send max 100 events per request

// Get auth token from storage
async function getAuthToken() {
  const result = await chrome.storage.local.get(["authToken"]);
  return result.authToken || null;
}

// Save auth token to storage
export async function setAuthToken(token) {
  await chrome.storage.local.set({ authToken: token });
}

// Clear auth token (logout)
export async function clearAuthToken() {
  await chrome.storage.local.remove(["authToken"]);
}

// Check if user is authenticated
export async function isAuthenticated() {
  const token = await getAuthToken();
  return token !== null;
}

// Sync events to backend
export async function syncEvents() {
  try {
    // Check if user is authenticated
    const token = await getAuthToken();

    if (!token) {
      console.log("[Sync] Not authenticated - skipping sync");
      return {
        success: false,
        message: "Not authenticated",
        requiresAuth: true,
      };
    }

    // Get all events from local database
    const events = await getAllEvents();

    if (events.length === 0) {
      console.log("[Sync] No events to sync");
      return {
        success: true,
        message: "No events to sync",
        synced: 0,
      };
    }

    console.log(`[Sync] Found ${events.length} events to sync`);

    // Split into batches
    const batches = [];
    for (let i = 0; i < events.length; i += SYNC_BATCH_SIZE) {
      batches.push(events.slice(i, i + SYNC_BATCH_SIZE));
    }

    let totalSynced = 0;
    const syncedEventIds = [];

    // Sync each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(
        `[Sync] Syncing batch ${i + 1}/${batches.length} (${batch.length} events)`,
      );

      try {
        const response = await fetch(`${API_BASE_URL}/events/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ events: batch }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.error(
              "[Sync] Authentication failed - token may be expired",
            );
            await clearAuthToken();
            return {
              success: false,
              message: "Authentication failed",
              requiresAuth: true,
            };
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`[Sync] Batch ${i + 1} synced successfully:`, result);

        // Track synced event IDs for deletion
        syncedEventIds.push(...batch.map((e) => e._id));
        totalSynced += batch.length;
      } catch (err) {
        console.error(`[Sync] Failed to sync batch ${i + 1}:`, err);
        // Don't delete events if sync failed
        // They'll be retried next time
        throw err;
      }
    }

    // Delete successfully synced events from local database
    if (syncedEventIds.length > 0) {
      console.log(
        `[Sync] Deleting ${syncedEventIds.length} synced events from local DB`,
      );
      await deleteEvents(syncedEventIds);
    }

    console.log(`[Sync] Sync complete - ${totalSynced} events synced`);

    return {
      success: true,
      message: "Sync complete",
      synced: totalSynced,
    };
  } catch (err) {
    console.error("[Sync] Sync failed:", err);
    return {
      success: false,
      message: err.message,
      error: err,
    };
  }
}

// Manual sync trigger (called from popup)
export async function triggerManualSync() {
  return await syncEvents();
}

// Get sync status
export async function getSyncStatus() {
  const isAuth = await isAuthenticated();
  const events = await getAllEvents();

  return {
    authenticated: isAuth,
    pendingEvents: events.length,
    lastSync: await getLastSyncTime(),
  };
}

// Save last sync time
async function saveLastSyncTime() {
  await chrome.storage.local.set({ lastSyncTime: Date.now() });
}

// Get last sync time
async function getLastSyncTime() {
  const result = await chrome.storage.local.get(["lastSyncTime"]);
  return result.lastSyncTime || null;
}
