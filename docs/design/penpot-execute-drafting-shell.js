/**
 * Penpot MCP — Shell — Drafting (1440×900)
 * Place to the right of Negotiation frame (x: 1500) or on Page 2.
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
  success: "#10b981",
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
shell.name = "Shell — Drafting";
shell.x = 1500;
shell.y = 0;
shell.resize(1440, 900);
shell.fills = fill(C.bgPrimary);

const header = penpot.createBoard();
header.name = "Header";
header.resize(1440, 56);
header.fills = fill(C.bgSecondary);
header.strokes = stroke(C.border);
header.x = 0;
header.y = 0;
shell.appendChild(header);
addText(header, "Logo", "Scriptorium", 24, 16, 200, 20, C.textPrimary, "600");
addText(header, "Project", "AI Coding Agents — Book", 200, 18, 400, 14, C.textSecondary);
addRect(header, "Phase Drafting", 1100, 14, 100, 28, C.success, 14);
addText(header, "Phase label", "Drafting", 1112, 20, 80, 12, C.bgPrimary, "600");

const left = penpot.createBoard();
left.name = "Left rail";
left.resize(240, 844);
left.fills = fill(C.bgSecondary);
left.strokes = stroke(C.border);
left.x = 0;
left.y = 56;
shell.appendChild(left);
addText(left, "Group Plan", "PLAN", 16, 16, 200, 11, C.textMuted, "500");
addText(left, "Nav Plan", "Brief & Outline", 16, 36, 200, 14, C.textSecondary);
addText(left, "Group Chapters", "CHAPTERS", 16, 72, 200, 11, C.textMuted, "500");
const chapters = [
  ["Ch 1", "Why agents matter now"],
  ["Ch 2", "Cursor in practice"],
  ["Ch 3", "Codex and CLI agents"],
  ["Ch 4", "Claude Code patterns"],
];
let cy = 92;
chapters.forEach(([short, title], i) => {
  const active = i === 1;
  if (active) addRect(left, `Nav ${short} sel`, 12, cy - 4, 216, 36, C.accent, 8);
  addText(left, `Nav ${short}`, `${short}: ${title}`, 24, cy + 4, 200, 13, active ? C.bgPrimary : C.textSecondary, active ? "600" : "400");
  cy += 44;
});

const center = penpot.createBoard();
center.name = "Center";
center.resize(880, 844);
center.fills = fill(C.bgPrimary);
center.x = 240;
center.y = 56;
shell.appendChild(center);
addText(center, "Tab Plan", "Plan", 28, 24, 48, 14, C.textMuted);
addRect(center, "Tab Draft active", 88, 16, 72, 32, C.bgTertiary, 8);
addText(center, "Tab Draft", "Draft", 100, 24, 56, 14, C.accent, "600");
addText(center, "Tab Preview", "Preview", 168, 24, 64, 14, C.textMuted);

const editor = penpot.createBoard();
editor.name = "Draft editor";
editor.resize(848, 720);
editor.fills = fill(C.bgSecondary);
editor.strokes = stroke(C.border);
editor.borderRadius = 10;
editor.x = 16;
editor.y = 64;
center.appendChild(editor);
addText(editor, "Toolbar", "B  I  H1  H2  Link", 16, 12, 400, 12, C.textMuted);
addText(
  editor,
  "Body",
  "## Cursor in practice\n\nCursor combines the editor with an agent that can read your repo, run tools, and apply patches. Non-technical readers should think of it as a writing partner that lives inside the project folder.\n\nStart every session with a clear goal in the chat panel…",
  16,
  48,
  816,
  15,
  C.textPrimary
);
addText(editor, "Word count", "1,240 words · section_02", 16, 680, 300, 12, C.textMuted);

const right = penpot.createBoard();
right.name = "Assistant";
right.resize(320, 844);
right.fills = fill(C.bgSecondary);
right.strokes = stroke(C.border);
right.x = 1120;
right.y = 56;
shell.appendChild(right);
addText(right, "Assistant title", "Assistant", 16, 16, 200, 16, C.textPrimary, "600");
addText(right, "Status", "Drafting section_02…", 16, 48, 280, 14, C.accent, "500");
addRect(right, "Chat area", 16, 80, 288, 640, C.bgTertiary, 8);
addText(
  right,
  "Chat",
  "Working on chapter 2. I will keep tone practical and avoid jargon unless defined inline.",
  24,
  96,
  272,
  14,
  C.textSecondary
);

return "Created Shell — Drafting at x=1500";
