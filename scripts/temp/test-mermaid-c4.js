const fs = require('fs');
let mdString = `## 26. Sơ đồ Giao tiếp Động (C4 Model - Dynamic Diagram)

Góc nhìn dành cho **Backend Developer**. Đây là **Level 4** của chuẩn C4 Model (Mức Dynamic). Nó kết hợp sức mạnh của Sequence Diagram nhưng sử dụng các khối Container của C4. Sơ đồ này cực hữu ích để mô tả luồng dữ liệu của một API cụ thể (Ví dụ: Luồng đồng bộ Check Proxy sống/chết).

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
`;

      let lines = mdString.split('\n');
      let newLines = [];
      let inMermaid = false;
      let inCodeBlock = false;
      
      const mermaidStart = /^(flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|graph|architecture-beta|architecture|sankey-beta|xychart-beta|block-beta|packet-beta|ishikawa|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\b/i;
      
      const looksLikeMermaid = (l) => {
        const t = l.trim();
        if (!t) return true;
        if (/^[ \t]/.test(l)) return true; // indented
        if (/^(subgraph|end|click|style|class|classDef|linkStyle|direction|note|participant|actor|activate|deactivate|group|service|title|x-axis|y-axis|quadrant-\d|requirement|functionalRequirement|performanceRequirement|interfaceRequirement|designConstraint|element|contains|copies|derives|satisfies|verifies|refines|traces|columns|space|Person|Person_Ext|System|System_Ext|SystemDb|SystemQueue|Container|Container_Ext|ContainerDb|ContainerQueue|ContainerExt|Component|Component_Ext|ComponentDb|ComponentQueue|Rel|Rel_U|Rel_D|Rel_L|Rel_R|Rel_Back|BiRel|Boundary|Enterprise_Boundary|System_Boundary|Container_Boundary|UpdateElementStyle|UpdateRelStyle|UpdateLayoutConfig)\b/i.test(t)) return true;
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
