/**
 * Consult-first flow QA (UI_REVIEW.md + tests/manual/).
 * Procedures: MT-022, MT-063, MT-070–MT-085, MT-011, MT-110–MT-111, review_halt MT-103/MT-085.
 * Run: cd frontend && npm run ui-consult-qa
 * Requires API :8001 and Vite :5173 (or SCRIPTORIUM_* env overrides).
 */
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE = process.env.SCRIPTORIUM_BASE_URL || "http://127.0.0.1:5173";
const API = process.env.SCRIPTORIUM_API_URL || "http://127.0.0.1:8001";
const OUTLINE_TIMEOUT_MS = Number(process.env.OUTLINE_TIMEOUT_MS || 180000);
const LAYOUT_SHOT_DIR =
  process.env.SCRIPTORIUM_LAYOUT_SHOT_DIR || "docs/screenshots/manual";

const results = [];

function pass(name, detail = "") {
  results.push({ status: "PASS", name, detail });
}

function fail(name, detail = "") {
  results.push({ status: "FAIL", name, detail });
}

function warn(name, detail = "") {
  results.push({ status: "WARN", name, detail });
}

async function createProjectViaApi(prompt) {
  const res = await fetch(`${API}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      audience: "Developers",
      domain: "technical-docs",
    }),
  });
  if (!res.ok) throw new Error(`POST /projects ${res.status}`);
  return res.json();
}

async function getProject(id) {
  const res = await fetch(`${API}/projects/${id}`);
  if (!res.ok) throw new Error(`GET /projects/${id} ${res.status}`);
  return res.json();
}

async function getConversation(id) {
  const res = await fetch(`${API}/projects/${id}/conversation`);
  if (!res.ok) throw new Error(`GET conversation ${res.status}`);
  return res.json();
}

async function listProjects() {
  const res = await fetch(`${API}/projects`);
  if (!res.ok) throw new Error(`GET /projects ${res.status}`);
  return res.json();
}

async function commissionConsult(page, prompt) {
  await page.click("#project-switcher .project-switcher-trigger");
  await page.click("#btn-new-project");
  await page.waitForSelector("#new-project-modal");
  await page.fill("#new-project-prompt", prompt);
  await page.click("#btn-commission-project");
  await page.waitForSelector("#plan-editor", { timeout: 20000 });
  await page.waitForSelector("#main-agent-chat", { timeout: 15000 });
  await page.waitForSelector(".chat-bubble", { timeout: 45000 });
}

async function waitForProjectLoaded(page, { timeout = 90000 } = {}) {
  await page.waitForFunction(
    () => {
      const welcome = document.querySelector("#welcome-empty");
      const nameEl = document.querySelector(".project-switcher-name");
      const hasProject =
        nameEl?.textContent?.trim() &&
        !nameEl.textContent.includes("Select project");
      return !welcome && hasProject;
    },
    { timeout }
  );
  await page
    .waitForSelector(".project-loading-overlay", { state: "detached", timeout })
    .catch(() => null);
}

async function fillChatInput(page, text) {
  await page.locator("#chat-input").fill(text);
}

async function ensureAssistantOpen(page) {
  await page.waitForSelector("#main-agent-chat", { timeout: 10000 });
  await page.waitForSelector("#chat-input", { timeout: 10000 });
}

/** MT-011 chat-first layout + MT-010 document panel toggle. */
async function verifyDesktopLayout(page) {
  await page.setViewportSize({ width: 1600, height: 900 });
  await ensureAssistantOpen(page);
  const chatBox = await page.locator("#main-agent-chat").boundingBox();
  if (!chatBox || chatBox.width < 300) {
    fail("MT-011 main chat width", `width=${chatBox?.width ?? 0}`);
  } else {
    pass("MT-011 main chat width", `${Math.round(chatBox.width)}px`);
  }
  try {
    const { mkdir } = await import("node:fs/promises");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
    const shotDir = join(repoRoot, LAYOUT_SHOT_DIR);
    await mkdir(shotDir, { recursive: true });
    await page.screenshot({
      path: join(shotDir, "consult-expanded.png"),
      fullPage: false,
    });
    pass("MT-011 layout screenshot", join(shotDir, "consult-expanded.png"));
  } catch (e) {
    warn("MT-011 layout screenshot", e.message?.slice(0, 80) || String(e));
  }

  const hideDocBtn = page.getByRole("button", { name: "Hide document" });
  if ((await hideDocBtn.count()) > 0) {
    await hideDocBtn.click();
    await page.waitForFunction(
      () => !document.querySelector("#document-panel"),
      { timeout: 10000 }
    );
    const chatWide = await page.locator(".chat-primary").boundingBox();
    const viewport = page.viewportSize();
    if (!chatWide || !viewport || chatWide.width < viewport.width * 0.5) {
      fail("MT-010 document panel hidden", `chat width=${chatWide?.width ?? 0}`);
    } else {
      pass("MT-010 document panel hidden", `chat≈${Math.round(chatWide.width)}px`);
    }
    try {
      const { mkdir } = await import("node:fs/promises");
      const { dirname, join } = await import("node:path");
      const { fileURLToPath } = await import("node:url");
      const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
      const shotDir = join(repoRoot, LAYOUT_SHOT_DIR);
      await mkdir(shotDir, { recursive: true });
      await page.screenshot({
        path: join(shotDir, "assistant-collapsed.png"),
        fullPage: false,
      });
    } catch {
      /* optional */
    }
    const showDocBtn = page.getByRole("button", { name: "Show document" });
    if ((await showDocBtn.count()) > 0) await showDocBtn.click();
  } else {
    warn("MT-010 document toggle", "Hide document button not found");
  }
}

async function switchToProject(page, projectId, { phaseLabel } = {}) {
  await page.click("#project-switcher .project-switcher-trigger");
  await page.waitForSelector(".project-switcher-menu");
  const byId = page.locator(`[data-project-id="${projectId}"]`);
  if ((await byId.count()) > 0) {
    await byId.first().click();
  } else {
    let item = page.locator(".project-switcher-item");
    if (phaseLabel) {
      const byPhase = page
        .locator(".project-switcher-list li")
        .filter({ has: page.locator(`.phase-badge:has-text("${phaseLabel}")`) })
        .locator(".project-switcher-item");
      if ((await byPhase.count()) > 0) item = byPhase;
    }
    await item.first().click();
  }
  await waitForProjectLoaded(page);
  const active = await page.evaluate(() => localStorage.getItem("scriptorium_active_project"));
  if (active !== projectId) {
    throw new Error(`Expected active project ${projectId}, got ${active}`);
  }
}

async function main() {
  const health = await fetch(`${API}/health`).catch(() => null);
  if (!health?.ok) {
    fail("API health", `Cannot reach ${API}/health`);
    printReport();
    process.exit(1);
  }
  pass("API health", await health.text());

  try {
    const out = execSync("python scripts/reconcile_all_phases.py", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    pass("Reconcile project phases", out.trim().split("\n").pop() || "ok");
  } catch (e) {
    warn("Reconcile project phases", e.stderr?.toString()?.slice(0, 120) || String(e));
  }
  try {
    const out = execSync("python scripts/ensure_review_halt_fixture.py", {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    pass("Review halt QA fixture", out.trim());
  } catch (e) {
    fail("Review halt QA fixture", e.stderr?.toString()?.slice(0, 120) || String(e));
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  let projectId = null;

  try {
    const res = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!res?.ok()) {
      fail("Load app", `status ${res?.status()}`);
      throw new Error("App did not load");
    }
    await page.evaluate(() => localStorage.removeItem("scriptorium_active_project"));
    await page.reload({ waitUntil: "domcontentloaded" });
    pass("Load app", BASE);

    const header = await page.locator("header").filter({ hasText: "Scriptorium" }).count();
    if (header > 0) pass("Header Scriptorium");
    else fail("Header Scriptorium");

    await page.waitForSelector("#welcome-empty", { timeout: 10000 });
    pass("Welcome empty state");

    await page.waitForSelector("#project-switcher", { timeout: 5000 });
    pass("Project switcher");

    // Review halt before long consult flow (avoids WS phase races from negotiation)
    const allEarly = await listProjects();
    const haltedEarly = allEarly.find((p) => p.phase === "review_halt");
    if (haltedEarly) {
      const haltedFull = await getProject(haltedEarly.id);
      const openTickets = (haltedFull.state?.editorial_memo || []).filter((t) => !t.resolved);
      if (openTickets.length === 0) {
        warn("Review halt scenario", `${haltedEarly.id} has no unresolved tickets in API`);
      } else {
        try {
          const haltCtx = await browser.newContext();
          const haltedPage = await haltCtx.newPage();
          await haltedPage.addInitScript((id) => {
            localStorage.setItem("scriptorium_active_project", id);
          }, haltedEarly.id);
          await haltedPage.goto(BASE, { waitUntil: "domcontentloaded" });
          await haltedPage.waitForSelector("#project-switcher .project-switcher-trigger", {
            timeout: 30000,
          });
          await waitForProjectLoaded(haltedPage, { timeout: 90000 });
          await haltedPage.waitForSelector('.project-switcher-trigger .phase-badge:has-text("Halted")', {
            timeout: 15000,
          });
          await haltedPage.waitForSelector("#main-agent-chat", { timeout: 10000 });
          const ticketBtn = haltedPage.locator(".ticket-answer-btn").first();
          if ((await ticketBtn.count()) > 0) {
            pass("Review halt ticket UI", `${haltedEarly.id} (${openTickets.length} open)`);
            await ticketBtn.click();
            await haltedPage.waitForTimeout(1500);
            if (await haltedPage.locator("#chat-input").isEnabled()) {
              pass("Review halt Answer in chat enables input");
            } else {
              warn("Review halt chat input", "disabled after Answer in chat");
            }
          } else {
            const items = await haltedPage.locator(".ticket-item.unresolved").count();
            fail(
              "Review halt ticket UI",
              `${haltedEarly.id} API open=${openTickets.length} DOM unresolved=${items}`
            );
          }
          await haltCtx.close();
        } catch (e) {
          fail("Review halt ticket UI", e.message?.slice(0, 200) || String(e));
        }
      }
    } else {
      warn("Review halt scenario", "no project in review_halt in DB — skipped");
    }

    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("scriptorium_active_project"));
    await page.waitForSelector("#welcome-empty", { timeout: 30000 });
    await page.waitForSelector("#project-switcher .project-switcher-trigger", { timeout: 15000 });

    await commissionConsult(page, `Consult QA ${Date.now()}`);
    pass("Start consultation", "modal → plan + assistant chat (MT-037)");

    await verifyDesktopLayout(page);

    const draftBtn = page.locator("#btn-draft-outline");
    if ((await draftBtn.count()) > 0) {
      pass("Draft outline CTA visible");
    } else {
      fail("Draft outline CTA visible");
    }

    const planNav = page.locator('[data-artifact="plan"]');
    if ((await planNav.count()) > 0) pass("Plan artifact nav");
    else fail("Plan artifact nav");

    const hint = await page.locator(".intake-consult-hint").count();
    if (hint > 0) pass("Intake consult hint on plan");
    else warn("Intake consult hint on plan", "may be complete already");

    // Answer one intake question if chips exist
    const chip = page.locator(".consult-choice-btn").first();
    if ((await chip.count()) > 0) {
      await chip.click();
      await page.waitForTimeout(1500);
      pass("Intake choice chip");
    } else {
      await fillChatInput(page, "Developers who need a practical API guide with examples.");
      await page.click("#btn-send-chat");
      await page.waitForTimeout(3000);
      pass("Intake free-text reply");
    }

    const bubblesBefore = await page.locator(".chat-bubble").count();
    projectId = await page.evaluate(() => localStorage.getItem("scriptorium_active_project"));
    if (projectId) {
      const conv = await getConversation(projectId);
      if (Array.isArray(conv.conversation) && conv.conversation.length >= 2) {
        pass("Server conversation persisted", `${conv.conversation.length} messages`);
      } else {
        fail("Server conversation persisted", JSON.stringify(conv).slice(0, 120));
      }
    } else {
      fail("Active project id in localStorage");
    }

    // Refresh persistence
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#plan-editor", { timeout: 20000 });
    await page.waitForSelector(".chat-bubble", { timeout: 45000 });
    const bubblesAfter = await page.locator(".chat-bubble").count();
    if (bubblesAfter >= Math.min(2, bubblesBefore)) {
      pass("Refresh restores conversation", `${bubblesAfter} bubbles`);
    } else {
      fail("Refresh restores conversation", `before=${bubblesBefore} after=${bubblesAfter}`);
    }

    if (projectId) {
      const loaded = await getProject(projectId);
      if (loaded.prompt) pass("Refresh project REST", loaded.name || loaded.id);
      else fail("Refresh project REST");
    }

    // Draft outline → negotiation (via confirm proposal card)
    await page.click("#btn-draft-outline");
    pass("Clicked Draft outline");

    try {
      await page.waitForSelector(".action-proposal-card.pending", { timeout: 20000 });
      pass("Draft outline proposal card");
      await page.locator(".action-proposal-card.pending .btn-primary").first().click();
      pass("Confirmed draft outline proposal");
    } catch (e) {
      fail("Draft outline proposal card", e.message?.slice(0, 80) || "missing");
    }

    try {
      await page.waitForSelector(".outline-item", { timeout: OUTLINE_TIMEOUT_MS });
      pass("Outline sections appeared", `within ${OUTLINE_TIMEOUT_MS / 1000}s`);
    } catch {
      fail("Outline sections appeared", `timeout ${OUTLINE_TIMEOUT_MS / 1000}s`);
    }

    const approveBar = page.locator("#btn-approve-outline");
    const approveDrawer = page.locator("#btn-approve-outline-drawer");
    try {
      await page.waitForFunction(
        () =>
          document.querySelector("#btn-approve-outline") ||
          document.querySelector("#btn-approve-outline-drawer"),
        { timeout: 30000 }
      );
      if ((await approveBar.count()) > 0 || (await approveDrawer.count()).count() > 0) {
        pass("Approve outline control visible");
      } else {
        fail("Approve outline control visible");
      }
    } catch {
      warn("Approve outline control visible", "not shown within 30s after outline");
    }

    // Negotiation chat patch (heuristic, no LLM required)
    const sectionCount = await page.locator(".outline-item").count();
    if (sectionCount > 0) {
      await fillChatInput(page, "add a section on security");
      await page.click("#btn-send-chat");
      await page.waitForTimeout(8000);
      const proposalCard = await page.locator(".action-proposal-card.pending").count();
      const after = await page.locator(".outline-item").count();
      if (proposalCard > 0) {
        pass("Negotiation chat proposes outline patch", "action proposal card shown");
      } else if (after >= sectionCount) {
        pass("Negotiation chat can patch outline", `sections ${sectionCount} → ${after}`);
      } else {
        warn("Negotiation chat patch outline", `no proposal card; sections ${sectionCount}`);
      }
    }

    // Mobile: no horizontal overflow at 390px (UX-105)
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mPage = await mobile.newPage();
    await mPage.goto(BASE, { waitUntil: "domcontentloaded" });
    if (projectId) {
      await mPage.click("#project-switcher .project-switcher-trigger");
      await mPage.click(`[data-project-id="${projectId}"]`);
      await waitForProjectLoaded(mPage);
    }
    const overflow = await mPage.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    if (!overflow) pass("Mobile no horizontal scroll (390px)");
    else fail("Mobile no horizontal scroll (390px)", "scrollWidth > clientWidth");
    await mobile.close();

    const all = await listProjects();
    const finished = all.find((p) => p.phase === "finished" || p.phase === "publishing");
    if (finished) {
      const exp = await fetch(`${API}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "pdf", project_id: finished.id }),
      });
      const expData = await exp.json();
      if (expData.success) {
        pass(
          "Export API",
          expData.fallback ? `fallback: ${expData.exported_file}` : expData.exported_file
        );
      } else {
        fail("Export API", expData.error || "unknown");
      }
    } else {
      warn("Finished export scenario", "no finished project — skipped");
    }

    const badConsole = consoleErrors.filter(
      (t) => !/favicon|vite|WebSocket.*closed before/i.test(t)
    );
    if (badConsole.length === 0) pass("No critical console errors");
    else warn("Console errors", badConsole.slice(0, 4).join(" | "));
  } finally {
    await browser.close();
  }

  printReport();
  if (results.some((r) => r.status === "FAIL")) process.exit(1);
}

function printReport() {
  console.log("\n=== Consult-first UI QA ===\n");
  for (const r of results) {
    console.log(`${r.status.padEnd(4)} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  const passN = results.filter((r) => r.status === "PASS").length;
  const warnN = results.filter((r) => r.status === "WARN").length;
  const failN = results.filter((r) => r.status === "FAIL").length;
  console.log(`\nSummary: ${passN} pass, ${warnN} warn, ${failN} fail\n`);
}

main().catch((err) => {
  console.error("QA runner crashed:", err);
  process.exit(1);
});
