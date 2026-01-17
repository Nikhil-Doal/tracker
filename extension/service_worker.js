import { writeEvent } from "./db.js";

function uuid() {
  return crypto.randomUUID();
}

async function logEvent(event) {
  const record = {
    _id: uuid(),
    v: 1,
    type: event.type,
    ts: event.ts,
    payload: event,
  };

  console.log("[Telemetry Event]", record);
  await writeEvent(record);
}

// ---- Utility ----
function logEvent(event) {
  console.log("[Telemetry Event]", event);
}

// ---- Tab Activated ----
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);

    logEvent({
      v: 1,
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
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;

  logEvent({
    v: 1,
    type: "TAB_UPDATED",
    tabId: tabId,
    windowId: tab.windowId,
    url: changeInfo.url,
    title: tab.title,
    ts: Date.now(),
  });
});

// ---- Window Focus Changed ----
chrome.windows.onFocusChanged.addListener((windowId) => {
  logEvent({
    v: 1,
    type: "WINDOW_FOCUS_CHANGED",
    windowId,
    ts: Date.now(),
  });
});

// ---- Idle State Changed ----
chrome.idle.onStateChanged.addListener((state) => {
  logEvent({
    v: 1,
    type: "IDLE_STATE_CHANGED",
    state,
    ts: Date.now(),
  });
});

// ---- Tab Created ----
chrome.tabs.onCreated.addListener((tab) => {
  logEvent({
    v: 1,
    type: "TAB_CREATED",
    tabId: tab.id,
    windowId: tab.windowId,
    url: tab.url,
    ts: Date.now(),
  });
});

// ---- Tab Removed ----
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  logEvent({
    v: 1,
    type: "TAB_REMOVED",
    tabId,
    windowId: removeInfo.windowId,
    ts: Date.now(),
  });
});
