// MathJax Configuration for 2ndBrain Chrome Extension
window.MathJax = {
  options: {
    enableMenu: false // Disable the context menu to prevent dynamic component loading
  },
  loader: {
    load: [] // Disable dynamic loading of external components (offline-first)
  },
  startup: {
    typeset: false // We trigger typesetting manually using typesetPromise
  }
};
