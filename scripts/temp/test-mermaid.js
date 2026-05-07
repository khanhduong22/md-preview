const fs = require('fs');
let mdString = `## 16. Ma trận Ưu tiên Tính năng

quadrantChart
    title Ma trận Ưu tiên Tính năng (Value vs. Effort)
    x-axis Tốn ít công (Low Effort) --> Tốn nhiều công (High Effort)
    y-axis Ít giá trị (Low Value) --> Nhiều giá trị (High Value)
    quadrant-1 Chiến lược Dài hạn (Làm từ từ)
    quadrant-2 Hái ra tiền (ƯU TIÊN LÀM NGAY)
    quadrant-3 Không đáng làm (Bỏ qua)
    quadrant-4 Cân nhắc (Có thể làm sau)
    
    "Bypass Google Captcha": [0.85, 0.95]
    "Quản lý Profile cơ bản": [0.15, 0.90]
    "Tích hợp API TMProxy": [0.30, 0.85]
    "Lướt nhiều trang (GA4)": [0.60, 0.80]
    "Xuất báo cáo Excel": [0.40, 0.40]
    "UI/UX Quá Bóng bẩy": [0.75, 0.35]
    "Đồng bộ Cloud": [0.90, 0.60]

---

## 17. Sơ đồ Kiến trúc Vật lý

architecture-beta
    group local(monitor)[Máy tính Khách hàng]
    
    service ui(internet)[Giao diện React] in local
    service node(server)[Core Node.js] in local
    service sqlite(database)[SQLite DB] in local
    
    group net(cloud)[Môi trường Mạng]
    service proxy(server)[Proxy Server] in net
    service google(internet)[Google / Websites] in net
    
    ui:R -- L:node
    node:B -- T:sqlite
    node:R -- L:proxy
    proxy:R -- L:google

---

## 14. Sơ đồ Yêu cầu Kỹ thuật

requirementDiagram
    requirement CORE_REQ {
        id: 1
        text: Khoi tao Profile tu dong
        risk: high
        verifyMethod: test
    }
    
    functionalRequirement CAPTCHA_REQ {
        id: 2
        text: Xu ly Captcha
        risk: high
        verifyMethod: test
    }

    performanceRequirement GA4_REQ {
        id: 3
        text: Tuong tac trang dich hon 10s
        risk: medium
        verifyMethod: analysis
    }

    interfaceRequirement PROXY_REQ {
        id: 4
        text: Nap API Proxy
        risk: low
        verifyMethod: demonstration
    }

    CORE_REQ contains CAPTCHA_REQ
    CORE_REQ contains GA4_REQ
    CORE_REQ contains PROXY_REQ

---

## 20. Biểu đồ Dòng chảy Phễu

sankey-beta
    Khởi tạo Profile, Proxy Mạng, 10000
    Proxy Mạng, Vượt Captcha Thành Công, 7000
    Proxy Mạng, Chết vì Timeout, 3000
    Vượt Captcha Thành Công, Trang Đích (Target), 6500
    Vượt Captcha Thành Công, Không thấy Keyword, 500
    Trang Đích (Target), Tương tác GA4 > 10s, 5000
    Trang Đích (Target), Thoát sớm (Bounce), 1500

---

## 23. Bảng Phân công Công việc

block-beta
    columns 3
    Title("BẢNG KANBAN TIẾN ĐỘ DỰ ÁN (SPRINT 1)"):::title:3
    
    space:3
    
    Todo("📌 CẦN LÀM (To Do)"):::col
    Inprog("⏳ ĐANG LÀM (In Progress)"):::col
    Done("✅ ĐÃ XONG (Done)"):::col
    
    space:3
    
    T1("Tích hợp API Tinsoft Proxy"):::task
    T2("Xử lý reCaptcha v3 Google"):::task
    T3("Thiết kế UI bằng React"):::task
    
    T4("Tính năng Auto-Update"):::task
    space
    T5("Setup Core Playwright"):::task
    
    classDef title fill:#0f172a,color:#fff,stroke-width:0px
    classDef col fill:#475569,color:#fff,stroke-width:0px
    classDef task fill:#3b82f6,color:#fff,stroke-width:0px
`;

      let lines = mdString.split('\n');
      let newLines = [];
      let inMermaid = false;
      let inCodeBlock = false;
      
      const mermaidStart = /^(flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|graph|architecture-beta|architecture|sankey-beta|xychart-beta|block-beta|packet-beta|ishikawa|quadrantChart|requirementDiagram)\b/i;
      
      const looksLikeMermaid = (l) => {
        const t = l.trim();
        if (!t) return true;
        if (/^[ \t]/.test(l)) return true; // indented
        if (/^(subgraph|end|click|style|class|classDef|linkStyle|direction|note|participant|actor|activate|deactivate|group|service|title|x-axis|y-axis|quadrant-\d|requirement|functionalRequirement|performanceRequirement|interfaceRequirement|designConstraint|element|contains|copies|derives|satisfies|verifies|refines|traces|columns|space)\b/i.test(t)) return true;
        if (/[-\=]+\>/.test(t) || t.includes('---') || t.includes('===')) return true;
        if (/\[.*\]|\(.*\)|{.*}|>.*\]/.test(t)) return true;
        if (t.includes(':')) return true;
        if (/^"[^"]+"\s*:\s*\[/.test(t)) return true; // quadrantChart data entries
        if (/^[A-Za-z0-9_]+$/.test(t)) return true;
        // sankey syntax
        if (t.split(',').length >= 3 && !isNaN(parseFloat(t.split(',').pop()))) return true;
        return false;
      };

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (line.trim().startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          newLines.push(line);
          continue;
        }
        
        if (!inCodeBlock && !inMermaid && mermaidStart.test(line.trim())) {
          inMermaid = true;
          newLines.push('```mermaid');
          newLines.push(line);
          continue;
        }
        
        if (inMermaid) {
          if (/^(#{1,6}\s|\-\-\-|> \s|\*\s|\-\s|\d+\.\s)/.test(line)) {
            newLines.push('```');
            inMermaid = false;
            newLines.push(line);
            continue;
          }
          
          if (i > 0 && lines[i-1].trim() === '' && line.trim() !== '') {
             if (!looksLikeMermaid(line)) {
               newLines.push('```');
               inMermaid = false;
               newLines.push(line);
               continue;
             }
          }
        }
        
        newLines.push(line);
      }
      
      if (inMermaid) {
        newLines.push('```');
      }

console.log(newLines.join('\n'));
