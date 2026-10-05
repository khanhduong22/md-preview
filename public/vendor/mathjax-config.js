// MathJax Configuration for 2ndBrain
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']]
  },
  options: {
    renderActions: {
      addMenu: [] // Disable context menu cleanly in MathJax 3
    }
  },
  loader: {
    load: [] // Disable dynamic loading of external components (offline-first)
  },
  startup: {
    typeset: false
  }
};
