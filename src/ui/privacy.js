export function initPrivacyNotice() {
  const privacyNotice = document.getElementById("privacy-notice");
  const privacyDismiss = document.getElementById("privacy-dismiss");

  const isShareLink =
    window.location.hash.includes("share=") ||
    window.location.href.includes("share=");

  if (isShareLink && privacyNotice) {
    privacyNotice.style.display = "none";
  } else if (privacyNotice && !localStorage.getItem("kido-privacy-dismissed")) {
    privacyNotice.style.display = "block";
  }

  if (privacyDismiss) {
    privacyDismiss.addEventListener("click", () => {
      privacyNotice.classList.add("dismissing");
      localStorage.setItem("kido-privacy-dismissed", "1");
      setTimeout(() => {
        privacyNotice.style.display = "none";
      }, 300);
    });
  }
}
