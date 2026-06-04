/**
 * Penpot MCP execute_code — Shell — Negotiation (1440×900)
 * Run via agent after high_level_overview + plugin connected on focused page.
 * Tokens from SCRIPTORIUM_PENPOT_BRIEF.md
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
  accentHover: "#e8c9a0",
  warning: "#f59e0b",
};

function fill(hex, opacity = 1) {
  return [{ fillColor: hex, fillOpacity: opacity }];
}

function stroke(hex, width = 1) {
  return [
    {
      strokeColor: hex,
      strokeWidth: width,
      strokeAlignment: "inside",
      strokeOpacity: 1,
    },
  ];
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

// Main artboard
const shell = penpot.createBoard();
shell.name = "Shell — Negotiation";
shell.x = 0;
shell.y = 0;
shell.resize(1440, 900);
shell.fills = fill(C.bgPrimary);

// Header 56px
const header = penpot.createBoard();
header.name = "Header";
header.resize(1440, 56);
header.fills = fill(C.bgSecondary);
header.strokes = stroke(C.border);
header.x = 0;
header.y = 0;
shell.appendChild(header);

addText(header, "Logo", "Scriptorium", 24, 16, 200, 20, C.textPrimary, "600");
addText(header, "Project", "AI Coding Agents — Book ▾", 200, 18, 400, 14, C.textSecondary);

const phaseChip = addRect(header, "Phase Negotiation", 1100, 14, 120, 28, C.warning, 14);
addText(header, "Phase label", "Negotiation", 1112, 20, 100, 12, C.bgPrimary, "600");

// Left rail 240px
const left = penpot.createBoard();
left.name = "Left rail";
left.resize(240, 844);
left.fills = fill(C.bgSecondary);
left.strokes = stroke(C.border);
left.x = 0;
left.y = 56;
shell.appendChild(left);

addRect(left, "Btn New", 16, 16, 208, 40, C.accent, 8);
addText(left, "Btn New label", "+ New", 24, 26, 180, 15, C.bgPrimary, "600");

addText(left, "Group Plan", "PLAN", 16, 72, 200, 11, C.textMuted, "500");
addRect(left, "Nav Plan selected", 12, 92, 216, 36, C.accent, 8);
addText(left, "Nav Plan", "Brief & Outline", 24, 102, 190, 14, C.bgPrimary, "500");

addText(left, "Group Chapters", "CHAPTERS", 16, 140, 200, 11, C.textMuted, "500");
addText(
  left,
  "Chapters empty",
  "Chapters appear after you approve the outline.",
  16,
  164,
  208,
  13,
  C.textMuted
);

// Center flex
const center = penpot.createBoard();
center.name = "Center";
center.resize(880, 844);
center.fills = fill(C.bgPrimary);
center.x = 240;
center.y = 56;
shell.appendChild(center);

// Tabs
const tabPlan = addRect(center, "Tab Plan active", 16, 16, 72, 32, C.bgTertiary, 8);
addText(center, "Tab Plan", "Plan", 28, 24, 48, 14, C.accent, "600");
addText(center, "Tab Draft", "Draft", 100, 24, 56, 14, C.textMuted);
addText(center, "Tab Preview", "Preview", 168, 24, 64, 14, C.textMuted);

// Brief card
const briefCard = penpot.createBoard();
briefCard.name = "Brief card";
briefCard.resize(848, 200);
briefCard.fills = fill(C.bgSecondary);
briefCard.strokes = stroke(C.border);
briefCard.borderRadius = 10;
briefCard.x = 16;
briefCard.y = 64;
center.appendChild(briefCard);

addText(briefCard, "Brief title", "Brief", 16, 16, 120, 16, C.textPrimary, "600");
const briefFields = [
  ["Title", "The AI Coding Agent Landscape"],
  ["Goal", "Help non-technical readers choose and use Cursor, Codex, and Claude Code."],
  ["Audience", "Knowledge workers adopting AI-assisted development"],
  ["Tone", "Clear, authoritative, practical"],
];
let by = 44;
briefFields.forEach(([label, value]) => {
  addText(briefCard, `Brief ${label} label`, label, 16, by, 80, 12, C.textMuted, "500");
  addText(briefCard, `Brief ${label}`, value, 100, by, 720, 14, C.textSecondary);
  by += 36;
});

// Outline card
const outlineCard = penpot.createBoard();
outlineCard.name = "Outline card";
outlineCard.resize(848, 520);
outlineCard.fills = fill(C.bgSecondary);
outlineCard.strokes = stroke(C.border);
outlineCard.borderRadius = 10;
outlineCard.x = 16;
outlineCard.y = 280;
center.appendChild(outlineCard);

addText(outlineCard, "Outline title", "Outline", 16, 16, 120, 16, C.textPrimary, "600");

const sections = [
  ["section_01", "Why agents matter now", "Frame the shift from autocomplete to autonomous coding."],
  ["section_02", "Cursor in practice", "IDE-native agent workflows and project rules."],
  ["section_03", "Codex and CLI agents", "Terminal-first loops and CI integration."],
  ["section_04", "Claude Code patterns", "Skills, MCP, and long-horizon tasks."],
  ["section_05", "Safety and governance", "Secrets, review gates, and team policy."],
  ["section_06", "Choosing your stack", "Decision matrix for teams and solo builders."],
];

let oy = 48;
sections.forEach(([id, title, goal]) => {
  addRect(outlineCard, `Row ${id}`, 12, oy, 824, 64, C.bgTertiary, 8);
  addText(outlineCard, `${id} id`, id, 24, oy + 10, 120, 12, C.textMuted);
  addText(outlineCard, `${id} title`, title, 24, oy + 26, 500, 15, C.textPrimary, "600");
  addText(outlineCard, `${id} goal`, goal, 24, oy + 44, 780, 13, C.textSecondary);
  oy += 72;
});

// Right assistant 320px
const right = penpot.createBoard();
right.name = "Assistant";
right.resize(320, 844);
right.fills = fill(C.bgSecondary);
right.strokes = stroke(C.border);
right.x = 1120;
right.y = 56;
shell.appendChild(right);

addText(right, "Assistant title", "Assistant", 16, 16, 200, 16, C.textPrimary, "600");
addText(right, "Pipeline", "Pipeline", 16, 48, 120, 12, C.textMuted, "500");
const steps = ["Brief", "Outline", "Negotiation", "Draft", "Review", "Publish"];
let sy = 68;
steps.forEach((s, i) => {
  const active = s === "Negotiation";
  addText(
    right,
    `Step ${s}`,
    (active ? "● " : "○ ") + s,
    16,
    sy,
    280,
    13,
    active ? C.accent : C.textSecondary
  );
  sy += 22;
});

addRect(right, "Chat area", 16, 200, 288, 520, C.bgTertiary, 8);
addText(
  right,
  "Chat placeholder",
  "Outline proposed. Review the Plan tab, then approve when ready.",
  24,
  216,
  272,
  14,
  C.textSecondary
);

addRect(right, "Approve btn", 16, 748, 288, 44, C.accent, 8);
addText(right, "Approve label", "Approve outline", 24, 760, 260, 15, C.bgPrimary, "600");
addText(right, "Ask hint", "Ask the editor…", 16, 800, 200, 12, C.textMuted);

return "Created Scriptorium Shell — Negotiation frame at 1440×900";
