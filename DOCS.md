# MD Preview — Documentation

> **Live:** [md.khanhdp.com](https://md.khanhdp.com)  
> **Stack:** Pure HTML + CSS + JavaScript · No backend · All data in `localStorage`

---

## Overview

MD Preview là personal Markdown note assistant hoạt động hoàn toàn client-side. Không tài khoản, không server lưu data — mọi thứ nằm trong trình duyệt của người dùng.

---

## Core Features

### 📝 Editor (Multi-Tab)
- Multi-tab với drag-to-reorder
- View modes: **Editor / Split / Preview**
- Focus Mode: ẩn toàn bộ chrome, chỉ giữ editor/preview
- Double-click tab title → đổi tên inline
- Sync scroll giữa editor và preview
- Toolbar responsive: text label ẩn ở 1080–1320px, chỉ hiện icon

### 🔍 Search (`Cmd/Ctrl+K`)
- Tìm kiếm full-text qua tất cả tabs
- Hiện snippet với keyword được highlight
- Click kết quả → switch tab + scroll preview đến đúng vị trí match (highlight tím 2s rồi tự fade)

### 📌 Pin & Tags
- Pin tab: nổi lên đầu danh sách, có indicator tím
- Tag tab: gán nhiều tag qua menu 3 chấm
- Filter tab theo tag qua dropdown bên tab bar

### 🕐 Version History
- Panel slide-in từ phải, **drag cạnh trái** để resize width (min 280px)
- **Auto-snapshot** mỗi 5 giây sau khi ngừng gõ (nếu content thay đổi ≥ 20 ký tự so với snapshot trước)
- Snapshot cũng được tạo khi bấm **Share**
- Mỗi snapshot gắn với `tabId` → history riêng biệt từng tab
- Panel title hiển thị tên tab đang active
- Click snapshot → xem **unified diff** so với snapshot kế trước (dùng `jsdiff`)

### 💾 Export
| Option | Mô tả |
|--------|-------|
| Markdown (.md) | Export raw markdown |
| HTML | Export rendered HTML với syntax highlight |
| PDF | In/save as PDF qua browser |
| **Download Single File (.html)** | Bundle toàn bộ app (CSS + JS inline) vào 1 file HTML duy nhất để dùng offline |
| Backup All Notes | Export toàn bộ `localStorage` ra file `.json` |
| Restore from Backup | Import lại file `.json` đã backup |

### 🔗 Share
- Nén content bằng LZ-string → encode vào URL hash
- Copy link vào clipboard
- Ai mở link → tự load content vào tab mới

### 🔒 Privacy Notice
- Banner hiện lần đầu truy cập: *"Your data stays on your device"*
- Dismiss = không hiện lại (lưu flag vào `localStorage`)

---

## Data Storage (`localStorage` keys)

| Key | Nội dung |
|-----|----------|
| `markdownViewerTabs` | Array các tab (id, title, content, viewMode, scrollPos, tags, pinned) |
| `markdownViewerActiveTab` | ID tab đang active |
| `markdownViewerUntitledCounter` | Counter đặt tên tab mới |
| `mdPreviewHistory` | Array snapshots version history (id, tabId, title, content, timestamp, parentId) |
| `mdPreviewPrivacyDismissed` | Flag đã đọc privacy notice |

---

## Version History — Logic

```
Tab A created  →  tabId: "tab_abc123"
  User edits   →  5 giây sau ngừng gõ  →  auto snapshot (nếu diff ≥ 20 chars)
  User shares  →  snapshot ngay lập tức
  
localStorage["mdPreviewHistory"] = [
  { id, tabId: "tab_abc123", content, timestamp, parentId: null },  // v1
  { id, tabId: "tab_abc123", content, timestamp, parentId: "v1_id" }, // v2
  ...
]
```

Khi mở Version History panel → filter `history.filter(s => s.tabId === activeTabId)` → chỉ show history của tab đó.

Diff view dùng `jsdiff` (CDN: `unpkg.com/diff@5.2.0`) — unified diff, render màu xanh/đỏ.

---

## Single-File Download

Khi click **Download Single File (.html)**:
1. Fetch `styles.css` và `script.js` từ server
2. Parse `index.html` qua `DOMParser`
3. Replace `<link href="styles.css">` → `<style>` inline
4. Replace `<script src="script.js">` → `<script>` inline
5. Download file `md-preview.html` — chạy offline hoàn toàn

---

## Deployment

```bash
npx vercel --prod --yes
```

- Platform: **Vercel**
- Domain: `md.khanhdp.com`
- Static site, không cần build step

---

## External Libraries (CDN)

| Library | Version | Dùng cho |
|---------|---------|---------|
| Bootstrap 5 | 5.3 | Layout, dropdown, modal |
| Bootstrap Icons | latest | Icon set |
| Marked.js | latest | Markdown → HTML parsing |
| DOMPurify | latest | Sanitize HTML output |
| highlight.js | latest | Syntax highlighting |
| LZ-String | latest | Compress content cho Share URL |
| jsdiff | 5.2.0 | Unified diff cho Version History |
| Mermaid | latest | Diagram rendering |
| KaTeX | latest | Math/LaTeX rendering |
| html2canvas + jsPDF | latest | PDF export |
| FileSaver.js | latest | File download helper |
