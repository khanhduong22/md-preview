// 2ndBrain Chrome Extension Background Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('2ndBrain Chrome Extension installed.');
});

// Enable side panel to open when clicking the action icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
