const fs = require('fs');
// Let's create a minimal test to see if mermaid reads escaped text from <pre> properly.
let html = `
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@latest/dist/mermaid.min.js"></script>
</head>
<body>
    <pre class="mermaid">
C4Dynamic
    title C4 Model (Dynamic) - Luồng Đồng bộ Dữ liệu Proxy API
    
    Container(ui, "React UI", "JavaScript", "Nhập thông tin Proxy")
    Container(main, "Electron Main", "Node.js", "Xử lý IPC")
    ContainerExt(api, "TMProxy API", "REST", "Hệ thống đối tác")
    ContainerDb(db, "SQLite DB", "Prisma", "Cơ sở dữ liệu")
    
    Rel(ui, main, "1. Gửi lệnh Test Proxy API")
    Rel(main, api, "2. Gọi HTTP GET lấy IP mới")
    Rel(api, main, "3. Trả về IP và Port")
    Rel(main, db, "4. Lưu thông tin IP vào Profile")
    Rel(main, ui, "5. Báo cáo trạng thái Xanh/Đỏ")
    </pre>
    <script>
      mermaid.initialize({ startOnLoad: true });
    </script>
</body>
</html>
`;
fs.writeFileSync('test-mermaid.html', html);
