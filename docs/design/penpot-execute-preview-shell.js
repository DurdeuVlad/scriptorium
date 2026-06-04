/**
 * Penpot MCP — Shell — Preview (1440×900)
 */
const C = {
  bgPrimary: "#0d0e12",
  bgSecondary: "#161821",
  bgTertiary: "#1f2230",
  border: "#2a2d3d",
  textPrimary: "#f3f4f6",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  accent: "#d4a574",
};

function fill(hex, opacity = 1) {
  return [{ fillColor: hex, fillOpacity: opacity }];
}
function stroke(hex, width = 1) {
  return [{ strokeColor: hex, strokeWidth: width, strokeAlignment: "inside", strokeOpacity: 1 }];
}
function addText(parent, label, content, x, y, w, size, color, weight = "400") {
  const t = penpot.createText(content);
  t.name = label;
  t.fontSize = String(size);
  t.fontWeight = weight;
  t.fills = fill(color);
  t.resize(w, size * 1.6);
  t.x = x;
  t.y = y;
  parent.appendChild(t);
  return t;
}
function addRect(parent, name, x, y, w, h, bg, radius = 0) {
  const r = penpot.createRectangle();
  r.name = name;
  r.resize(w, h);
  r.fills = fill(bg);
  r.borderRadius = radius;
  r.x = x;
  r.y = y;
  parent.appendChild(r);
  return r;
}

const shell = penpot.createBoard();
shell.name = "Shell — Preview";
shell.x = 3000;
shell.y = 0;
shell.resize(1440, 900);
shell.fills = fill(C.bgPrimary);

const header = penpot.createBoard();
header.name = "Header";
header.resize(1440, 56);
header.fills = fill(C.bgSecondary);
header.strokes = stroke(C.border);
shell.appendChild(header);
addText(header, "Logo", "Scriptorium", 24, 16, 200, 20, C.textPrimary, "600");
addText(header, "Project", "AI Coding Agents — Book", 200, 18, 400, 14, C.textSecondary);
addText(header, "Phase", "Review", 1100, 20, 80, 12, C.textSecondary, "600");

const left = penpot.createBoard();
left.name = "Left rail";
left.resize(240, 844);
left.fills = fill(C.bgSecondary);
left.strokes = stroke(C.border);
left.x = 0;
left.y = 56;
shell.appendChild(left);
addText(left, "Export group", "EXPORT", 16, 16, 200, 11, C.textMuted, "500");
addRect(left, "Export row", 12, 36, 216, 40, C.bgTertiary, 8);
addText(left, "Export file", "final_manuscript", 24, 48, 190, 13, C.accent, "500");
addText(left, "Chapters hint", "All chapters merged", 16, 88, 208, 12, C.textMuted);

const center = penpot.createBoard();
center.name = "Center";
center.resize(880, 844);
center.fills = fill(C.bgPrimary);
center.x = 240;
center.y = 56;
shell.appendChild(center);
addText(center, "Tab Plan", "Plan", 28, 24, 48, 14, C.textMuted);
addText(center, "Tab Draft", "Draft", 100, 24, 56, 14, C.textMuted);
addRect(center, "Tab Preview active", 168, 16, 80, 32, C.bgTertiary, 8);
addText(center, "Tab Preview", "Preview", 180, 24, 64, 14, C.accent, "600");

const preview = penpot.createBoard();
preview.name = "Preview document";
preview.resize(848, 760);
preview.fills = fill(C.bgSecondary);
preview.strokes = stroke(C.border);
preview.borderRadius = 10;
preview.x = 16;
preview.y = 64;
center.appendChild(preview);
addText(preview, "H1", "The AI Coding Agent Landscape", 32, 32, 760, 28, C.textPrimary, "600");
addText(preview, "H2", "Why agents matter now", 32, 80, 760, 20, C.textPrimary, "600");
addText(
  preview,
  "P1",
  "Autonomous coding agents are moving from experiments to daily workflows. This preview shows how the finished manuscript will read when exported.",
  32,
  112,
  760,
  15,
  C.textSecondary
);
addText(preview, "H2b", "Cursor in practice", 32, 180, 760, 20, C.textPrimary, "600");
addText(
  preview,
  "P2",
  "Cursor keeps context inside your repository: rules, skills, and MCP tools shape what the agent can do without leaving the IDE.",
  32,
  212,
  760,
  15,
  C.textSecondary
);

const right = penpot.createBoard();
right.name = "Assistant";
right.resize(320, 844);
right.fills = fill(C.bgSecondary);
right.strokes = stroke(C.border);
right.x = 1120;
right.y = 56;
shell.appendChild(right);
addText(right, "Assistant title", "Assistant", 16, 16, 200, 16, C.textPrimary, "600");
addText(right, "Hint", "Read-only preview. Edit in Draft tab.", 16, 48, 280, 13, C.textMuted);

return "Created Shell — Preview at x=3000";
