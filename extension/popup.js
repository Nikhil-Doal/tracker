import { getEventCount, clearAllEvents } from "./db.js";
import {
  getSyncStatus,
  setAuthToken,
  clearAuthToken,
  isAuthenticated,
} from "./sync.js";

// Configuration
const DASHBOARD_URL = "http://localhost:3000"; // Update with your Next.js URL

// DOM Elements
const loggedOut = document.getElementById("logged-out");
const loggedIn = document.getElementById("logged-in");
const loginBtn = document.getElementById("login-btn");
const syncBtn = document.getElementById("sync-btn");
const viewDashboardBtn = document.getElementById("view-dashboard-btn");
const clearDataBtn = document.getElementById("clear-data-btn");
const eventCountEl = document.getElementById("event-count");
const pendingCountEl = document.getElementById("pending-count");
const syncStatusDot = document.getElementById("sync-status-dot");
const syncStatusText = document.getElementById("sync-status-text");
const lastSyncEl = document.getElementById("last-sync");
const userEmailEl = document.getElementById("user-email");

// Initialize popup
async function init() {
  await updateUI();
  setupEventListeners();
}

// Update UI based on auth state and stats
async function updateUI() {
  try {
    // Check authentication
    const authenticated = await isAuthenticated();

    if (authenticated) {
      loggedOut.style.display = "none";
      loggedIn.style.display = "block";
      syncBtn.disabled = false;
      syncStatusDot.className = "status-dot status-active";
    } else {
      loggedOut.style.display = "block";
      loggedIn.style.display = "none";
      syncBtn.disabled = true;
      syncStatusDot.className = "status-dot status-idle";
      syncStatusText.textContent = "Login required to sync";
    }

    // Get stats
    const eventCount = await getEventCount();
    eventCountEl.textContent = eventCount.toLocaleString();

    const syncStatus = await getSyncStatus();
    pendingCountEl.textContent = syncStatus.pendingEvents.toLocaleString();

    if (syncStatus.lastSync) {
      const lastSyncDate = new Date(syncStatus.lastSync);
      lastSyncEl.textContent = `Last sync: ${formatTimeAgo(lastSyncDate)}`;
    } else {
      lastSyncEl.textContent = "Never synced";
    }

    // Get user email from storage if available
    const result = await chrome.storage.local.get(["userEmail"]);
    if (result.userEmail) {
      userEmailEl.textContent = result.userEmail;
    }
  } catch (err) {
    console.error("Error updating UI:", err);
  }
}

// Setup event listeners
function setupEventListeners() {
  loginBtn.addEventListener("click", handleLogin);
  syncBtn.addEventListener("click", handleSync);
  viewDashboardBtn.addEventListener("click", handleViewDashboard);
  clearDataBtn.addEventListener("click", handleClearData);
}

// Handle login - open dashboard in new tab
function handleLogin() {
  chrome.tabs.create({ url: `${DASHBOARD_URL}/login` });
}

// Handle manual sync
async function handleSync() {
  try {
    syncBtn.disabled = true;
    syncBtn.textContent = "Syncing...";
    syncStatusDot.className = "status-dot status-syncing";
    syncStatusText.textContent = "Syncing...";

    // Send message to service worker to trigger sync
    const response = await chrome.runtime.sendMessage({
      action: "MANUAL_SYNC",
    });

    if (response.success) {
      syncStatusDot.className = "status-dot status-active";
      syncStatusText.textContent = "Sync successful";

      // Update last sync time
      await chrome.storage.local.set({ lastSyncTime: Date.now() });

      // Show success briefly
      setTimeout(() => {
        syncStatusText.textContent = "Up to date";
      }, 2000);
    } else {
      syncStatusDot.className = "status-dot status-error";
      syncStatusText.textContent = "Sync failed";

      if (response.requiresAuth) {
        // Token expired, need to re-login
        alert("Session expired. Please log in again.");
        await clearAuthToken();
      } else {
        alert(`Sync failed: ${response.message || "Unknown error"}`);
      }
    }

    await updateUI();
  } catch (err) {
    console.error("Sync error:", err);
    syncStatusDot.className = "status-dot status-error";
    syncStatusText.textContent = "Sync failed";
    alert(`Sync failed: ${err.message}`);
  } finally {
    syncBtn.disabled = false;
    syncBtn.textContent = "Sync Now";
  }
}

// Handle view dashboard
function handleViewDashboard() {
  chrome.tabs.create({ url: DASHBOARD_URL });
}

// Handle clear local data
async function handleClearData() {
  const confirmed = confirm(
    "Are you sure you want to clear all local data? This cannot be undone. Synced data on the server will not be affected.",
  );

  if (confirmed) {
    try {
      await clearAllEvents();
      await chrome.storage.local.clear();
      alert("Local data cleared successfully!");
      await updateUI();
    } catch (err) {
      console.error("Error clearing data:", err);
      alert(`Failed to clear data: ${err.message}`);
    }
  }
}

// Format time ago (e.g., "2 minutes ago")
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

// Listen for auth messages from the dashboard
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "AUTH_SUCCESS") {
    setAuthToken(message.token)
      .then(() => chrome.storage.local.set({ userEmail: message.email }))
      .then(() => updateUI())
      .then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.action === "LOGOUT") {
    clearAuthToken()
      .then(() => chrome.storage.local.remove(["userEmail"]))
      .then(() => updateUI())
      .then(() => sendResponse({ success: true }));
    return true;
  }
});

// Initialize when popup opens
init();
