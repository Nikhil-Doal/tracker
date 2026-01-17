import { writeEvent, getAllEvents, deleteEvents } from "./db.js";
import { syncEvents } from "./sync.js";

function uuid() {
  return crypto.randomUUID();
}

// Log event to IndexedDB
async function logEvent(event) {
  const record = {
    _id: uuid(),
    v: 1,
    type: event.type,
    ts: event.ts,
    payload: event,
  };

  console.log("[Telemetry Event]", record);

  try {
    await writeEvent(record);
  } catch (err) {
    console.error("Failed to write event:", err);
  }
}

// ---- Tab Activated ----
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);

    await logEvent({
      type: "TAB_ACTIVATED",
      tabId: tab.id,
      windowId: tab.windowId,
      url: tab.url,
      title: tab.title,
      ts: Date.now(),
    });
  } catch (err) {
    console.error("TAB_ACTIVATED error:", err);
  }
});

// ---- Tab Updated (URL change only) ----
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;

  try {
    await logEvent({
      type: "TAB_UPDATED",
      tabId: tabId,
      windowId: tab.windowId,
      url: changeInfo.url,
      title: tab.title,
      ts: Date.now(),
    });
  } catch (err) {
    console.error("TAB_UPDATED error:", err);
  }
});

// ---- Window Focus Changed ----
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  try {
    await logEvent({
      type: "WINDOW_FOCUS_CHANGED",
      windowId,
      ts: Date.now(),
    });
  } catch (err) {
    console.error("WINDOW_FOCUS_CHANGED error:", err);
  }
});

// ---- Idle State Changed ----
chrome.idle.onStateChanged.addListener(async (state) => {
  try {
    await logEvent({
      type: "IDLE_STATE_CHANGED",
      state,
      ts: Date.now(),
    });
  } catch (err) {
    console.error("IDLE_STATE_CHANGED error:", err);
  }
});

// ---- Tab Created ----
chrome.tabs.onCreated.addListener(async (tab) => {
  try {
    await logEvent({
      type: "TAB_CREATED",
      tabId: tab.id,
      windowId: tab.windowId,
      url: tab.url,
      ts: Date.now(),
    });
  } catch (err) {
    console.error("TAB_CREATED error:", err);
  }
});

// ---- Tab Removed ----
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  try {
    await logEvent({
      type: "TAB_REMOVED",
      tabId,
      windowId: removeInfo.windowId,
      ts: Date.now(),
    });
  } catch (err) {
    console.error("TAB_REMOVED error:", err);
  }
});

// ---- Periodic Sync ----
// Sync every 5 minutes
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

async function periodicSync() {
  console.log("[Sync] Starting periodic sync...");
  await syncEvents();
}

// Set up periodic sync using alarms API (more reliable than setInterval in service workers)
chrome.alarms.create("periodicSync", {
  periodInMinutes: 5,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "periodicSync") {
    periodicSync();
  }
});

// Also sync when extension starts up
chrome.runtime.onStartup.addListener(() => {
  console.log("[Extension] Started - running initial sync");
  periodicSync();
});

// Sync when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Extension] Installed/Updated - running initial sync");
  periodicSync();
});

// Listen for manual sync requests from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "MANUAL_SYNC") {
    console.log("[Sync] Manual sync requested");
    syncEvents()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((err) => {
        console.error("[Sync] Manual sync failed:", err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep message channel open for async response
  }

  if (message.action === "GET_STATS") {
    getAllEvents()
      .then((events) => {
        sendResponse({
          success: true,
          count: events.length,
          events: events.slice(0, 10), // Return first 10 for preview
        });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});
