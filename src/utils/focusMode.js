let isFocusMode = false;

export function getIsFocusMode() {
  return isFocusMode;
}

export function setFocusMode(enable) {
  isFocusMode = Boolean(enable);
  if (document.body) {
    if (isFocusMode) {
      document.body.classList.add('focus-mode');
    } else {
      document.body.classList.remove('focus-mode');
    }
  }
}

export function toggleFocusMode() {
  setFocusMode(!isFocusMode);
}

export function initFocusMode() {
  const focusModeBtn = document.getElementById("focus-mode-btn");
  const exitFocusBtn = document.getElementById("exit-focus-btn");

  if (focusModeBtn) focusModeBtn.addEventListener("click", toggleFocusMode);
  if (exitFocusBtn) exitFocusBtn.addEventListener("click", toggleFocusMode);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isFocusMode) {
      setFocusMode(false);
    }
  });
}

