import { initHistory, initHistoryUI } from "../core/history.js";
import { STORAGE_KEY, ACTIVE_TAB_KEY, UNTITLED_COUNTER_KEY, VAULT_HANDLE_KEY, GROUPS_KEY, HISTORY_KEY } from "../core/constants.js";

import { AppState } from '../core/state.js';

export function initBackupSetup() {
// ========================================
initHistory();
initHistoryUI();
// 6. BACKUP / RESTORE
// ========================================
const backupBtn = document.getElementById("backup-btn");
const restoreBtn = document.getElementById("restore-btn");
const restoreFileInput = document.getElementById("restore-file-input");

async function exportBackup() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {},
  };
  // Collect all kido-md related keys
  const keysToBackup = [
    STORAGE_KEY,
    ACTIVE_TAB_KEY,
    UNTITLED_COUNTER_KEY,
    GROUPS_KEY,
    HISTORY_KEY,
    "kido-privacy-dismissed",
  ];
  for (const key of keysToBackup) {
    const val = await localforage.getItem(key);
    if (val !== null) backup.data[key] = val;
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kido-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup.data || typeof backup.data !== "object") {
        alert("Invalid backup file format.");
        return;
      }
      if (!confirm("This will replace all your current notes. Are you sure?"))
        return;

      for (const [key, value] of Object.entries(backup.data)) {
        await localforage.setItem(key, value);
      }

      alert("Backup restored successfully! The page will reload.");
      location.reload();
    } catch (err) {
      alert("Failed to read backup file: " + err.message);
    }
  };
  reader.readAsText(file);
}

if (backupBtn) {
  backupBtn.addEventListener("click", (e) => {
    e.preventDefault();
    exportBackup();
  });
}

if (restoreBtn) {
  restoreBtn.addEventListener("click", (e) => {
    e.preventDefault();
    restoreFileInput.click();
  });
}

if (restoreFileInput) {
  restoreFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) importBackup(e.target.files[0]);
    restoreFileInput.value = ""; // reset
  });
}
}
