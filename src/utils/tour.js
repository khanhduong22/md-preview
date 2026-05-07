import { AppState } from "../core/state.js";
import { setViewMode, isSplitReversed, currentViewMode } from "./viewMode.js";
export function startTour() {
    if (!window.driver) return;
    
    // Tạm ẩn privacy banner để không làm lệch vị trí popover
    const privacyNotice = document.getElementById('privacy-notice');
    const privacyDismiss = document.getElementById('privacy-dismiss');
    if (privacyNotice && privacyNotice.style.display !== 'none') {
      if (privacyDismiss) privacyDismiss.click();
      else privacyNotice.style.display = 'none';
    }

    const driverObj = window.driver.js.driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      nextBtnText: 'Tiếp tục ➔',
      prevBtnText: '⬅ Quay lại',
      doneBtnText: 'Hoàn thành ✔',
      steps: [
        {
          popover: {
            title: 'Chào mừng đến với 2ndBrain! 🚀',
            description: 'Chào mừng bạn đến với Markdown Editor cao cấp. Hãy dành 1 phút để lướt qua các tính năng đỉnh cao nhé!',
            align: 'center'
          }
        },
        {
          element: '#open-vault-btn',
          popover: {
            title: 'Kết nối Thư mục (Vault) 📂',
            description: 'Tính năng cực mạnh! Cấp quyền cho trình duyệt đọc/ghi trực tiếp vào một thư mục trên máy tính của bạn. Giống hệt cách Obsidian hoạt động!',
            side: "right", align: 'start'
          }
        },
        {
          element: '.sidebar-explorer',
          popover: {
            title: 'Quản lý File Local 🗂️',
            description: 'Toàn bộ cây thư mục và tài liệu của bạn sẽ hiển thị ở đây. An toàn tuyệt đối, không có bất kỳ dữ liệu nào gửi lên Server lạ.',
            side: "right", align: 'start'
          }
        },
        {
          element: '.tab-bar',
          popover: {
            title: 'Tab & Group Tabs 📑',
            description: 'Mở nhiều file cùng lúc, gom nhóm (Group) màu sắc các Tab lại với nhau siêu gọn gàng y hệt trình duyệt Chrome!',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#tag-filter-btn',
          popover: {
            title: 'Lọc bài viết theo Tag 🏷️',
            description: 'Chỉ cần gõ #tag vào bài viết, hệ thống sẽ tự động gom nhóm và giúp bạn lọc file cực nhanh ở đây.',
            side: "bottom", align: 'end'
          }
        },
        {
          element: '#tab-reset-btn',
          popover: {
            title: 'Reset Toàn bộ 🗑️',
            description: 'Nếu muốn dọn dẹp sạch sẽ toàn bộ Cache hiện tại để làm lại từ đầu, hãy bấm nút này.',
            side: "bottom", align: 'end'
          }
        },
        {
          element: '.editor-pane',
          popover: {
            title: 'Soạn thảo Siêu tốc ⚡',
            description: 'Gõ Markdown ở đây. Bạn có thể kéo thả ảnh vào hoặc Paste ảnh trực tiếp. Đừng quên dùng phím tắt Ctrl+S để lưu nhé!',
            side: "right", align: 'start'
          }
        },
        {
          element: '.preview-pane',
          popover: {
            title: 'Render Thời gian thực 👁️',
            description: 'Kết quả hiển thị ngay lập tức. Hỗ trợ Toán học (MathJax), Code Highlight (Highlight.js) và tới 30 loại sơ đồ siêu đỉnh (Mermaid.js)!',
            side: "left", align: 'start'
          }
        },
        {
          element: '.view-mode-group',
          popover: {
            title: 'Chế độ Hiển thị 🪟',
            description: 'Chỉ Code, Chia đôi, hoặc Chỉ xem. Bấm nút Hide (mũi tên lên) ẩn thanh công cụ để tập trung tối đa.',
            side: "bottom", align: 'center'
          }
        },
        {
          element: '#toggle-sync',
          popover: {
            title: 'Đồng bộ Cuộn trang ↕️',
            description: 'Tính năng cuộn đồng thời Editor và Preview cực mượt, giúp bạn không bao giờ bị lạc dòng.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#import-button',
          popover: {
            title: 'Import File 📤',
            description: 'Nạp nhanh một file Markdown (.md) từ máy tính của bạn vào Editor.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#exportDropdown',
          popover: {
            title: 'Xuất / Nhập Đa dạng 📥',
            description: 'Hỗ trợ xuất sang HTML, PDF, Markdown hoặc Backup tải toàn bộ File (JSON) về máy.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#copy-markdown-button',
          popover: {
            title: 'Copy Markdown 📋',
            description: 'Copy nhanh toàn bộ nội dung Markdown hiện tại vào Clipboard chỉ với một Click.',
            side: "bottom", align: 'start'
          }
        },
        {
          element: '#share-button',
          popover: {
            title: 'Chia sẻ không cần Database 🔗',
            description: 'Toàn bộ bài viết sẽ được nén lại thành Link. Bạn bè có thể xem ngay lập tức qua mạng mà không cần Database hay Đăng nhập!',
            side: "bottom", align: 'end'
          }
        },
        {
          element: '#search-btn',
          popover: {
            title: 'Tìm kiếm Toàn năng 🔍',
            description: 'Bấm phím tắt Ctrl+K để tìm kiếm nội dung siêu tốc xuyên suốt toàn bộ các file trong Vault của bạn.',
            side: "bottom", align: 'end'
          }
        },
        {
          element: '#history-btn',
          popover: {
            title: 'Lịch sử Phiên bản ⏱️',
            description: 'Lỡ tay xoá nhầm? Đừng lo! Hệ thống tự động lưu lại các mốc thời gian để bạn dễ dàng phục hồi lại bản nháp cũ.',
            side: "bottom", align: 'end'
          }
        },
        {
          element: '#tour-btn',
          popover: {
            title: 'Trợ giúp ❓',
            description: 'Bạn có thể xem lại hướng dẫn này bất cứ lúc nào bằng nút này. Chúc bạn làm việc hiệu quả!',
            side: "left", align: 'center'
          }
        }
      ]
    });
    driverObj.drive();
  }
export function initTour() {
  const tourBtn = document.getElementById("tour-btn");
  if (tourBtn) {
    tourBtn.addEventListener("click", startTour);
  }

  const hasSeenTour = localStorage.getItem("hasSeenTour");
  if (!hasSeenTour && window.innerWidth >= 768) {
    setTimeout(() => {
      startTour();
      localStorage.setItem("hasSeenTour", "true");
    }, 1000);
  }
}
