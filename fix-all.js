const fs = require('fs');
let content = fs.readFileSync('all-chart.md', 'utf8');

// quadrantChart fix
content = content.replace(/title Ma trận Ưu tiên Tính năng \(Value vs. Effort\)/, 'title "Ma trận Ưu tiên Tính năng (Value vs. Effort)"');
content = content.replace(/x-axis Tốn ít công \(Low Effort\) --> Tốn nhiều công \(High Effort\)/, 'x-axis "Tốn ít công (Low Effort)" --> "Tốn nhiều công (High Effort)"');
content = content.replace(/y-axis Ít giá trị \(Low Value\) --> Nhiều giá trị \(High Value\)/, 'y-axis "Ít giá trị (Low Value)" --> "Nhiều giá trị (High Value)"');
content = content.replace(/quadrant-1 Chiến lược Dài hạn \(Làm từ từ\)/, 'quadrant-1 "Chiến lược Dài hạn (Làm từ từ)"');
content = content.replace(/quadrant-2 Hái ra tiền \(ƯU TIÊN LÀM NGAY\)/, 'quadrant-2 "Hái ra tiền (ƯU TIÊN LÀM NGAY)"');
content = content.replace(/quadrant-3 Không đáng làm \(Bỏ qua\)/, 'quadrant-3 "Không đáng làm (Bỏ qua)"');
content = content.replace(/quadrant-4 Cân nhắc \(Có thể làm sau\)/, 'quadrant-4 "Cân nhắc (Có thể làm sau)"');

// architecture-beta fix
content = content.replace(/group local\(monitor\)\[Máy tính Khách hàng\]/, 'group local(monitor)["Máy tính Khách hàng"]');
content = content.replace(/service ui\(internet\)\[Giao diện React\] in local/, 'service ui(internet)["Giao diện React"] in local');
content = content.replace(/service node\(server\)\[Core Node\.js\] in local/, 'service node(server)["Core Node.js"] in local');
content = content.replace(/service sqlite\(database\)\[SQLite DB\] in local/, 'service sqlite(database)["SQLite DB"] in local');
content = content.replace(/group net\(cloud\)\[Môi trường Mạng\]/, 'group net(cloud)["Môi trường Mạng"]');
content = content.replace(/service proxy\(server\)\[Proxy Server\] in net/, 'service proxy(server)["Proxy Server"] in net');
content = content.replace(/service google\(internet\)\[Google \/ Websites\] in net/, 'service google(internet)["Google / Websites"] in net');

// block-beta fix
content = content.replace(/Title\("BẢNG KANBAN TIẾN ĐỘ DỰ ÁN \(SPRINT 1\)"\):::title:3/, 'TITLE(["BẢNG KANBAN TIẾN ĐỘ DỰ ÁN (SPRINT 1)"]):::title:3');
content = content.replace(/Todo\("📌 CẦN LÀM \(To Do\)"\):::col/, 'Todo(["📌 CẦN LÀM (To Do)"]):::col');
content = content.replace(/Inprog\("⏳ ĐANG LÀM \(In Progress\)"\):::col/, 'Inprog(["⏳ ĐANG LÀM (In Progress)"]):::col');
content = content.replace(/Done\("✅ ĐÃ XONG \(Done\)"\):::col/, 'Done(["✅ ĐÃ XONG (Done)"]):::col');

fs.writeFileSync('all-chart.md', content);
