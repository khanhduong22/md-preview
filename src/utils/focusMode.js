export function initFocusMode() {
  const focusModeBtn = document.getElementById("focus-mode-btn");
  const exitFocusBtn = document.getElementById("exit-focus-btn");

  let isFocusMode = false;

  function toggleFocusMode() {
    isFocusMode = !isFocusMode;
    if (isFocusMode) {
      document.body.classList.add('focus-mode');
    } else {
      document.body.classList.remove('focus-mode');
    }
  }

  if (focusModeBtn) focusModeBtn.addEventListener("click", toggleFocusMode);
  if (exitFocusBtn) exitFocusBtn.addEventListener("click", toggleFocusMode);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isFocusMode) {
      toggleFocusMode();
    }
  });
}
