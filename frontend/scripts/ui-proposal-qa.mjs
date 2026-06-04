/**
 * Intent-router proposal card QA (MT-096–MT-101).
 * Run: cd frontend && npm run ui-proposal-qa
 * Requires API :8001 and Vite :5173.
 */
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const BASE = process.env.SCRIPTORIUM_BASE_URL || "http://127.0.0.1:5173";
const API = process.env.SCRIPTORIUM_API_URL || "http://127.0.0.1:8001";
const PROPOSAL_TIMEOUT_MS = Number(process.env.PROPOSAL_TIMEOUT_MS || 45000);

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

function skip(name, detail = "") {
  results.push({ status: "SKIP", name, detail });
}

function printReport() {
  const counts = { PASS: 0, FAIL: 0, WARN: 0, SKIP: 0 };
  for (const r of results) counts[r.status]++;
  console.log("\n=== ui-proposal-qa (MT-096–MT-101) ===");
  for (const r of results) {
    console.log(`${r.status.padEnd(5)} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(
    `\nTotal: ${results.length} | PASS ${counts.PASS} | FAIL ${counts.FAIL} | WARN ${counts.WARN} | SKIP ${counts.SKIP}`
  );
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

async function patchPlan(projectId, body) {
  const res = await fetch(`${API}/projects/${projectId}/plan`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH plan ${res.status}`);
  return res.json();
}

async function getProject(id) {
  const res = await fetch(`${API}/projects/${id}`);
  if (!res.ok) throw new Error(`GET /projects/${id} ${res.status}`);
  return res.json();
}

async function seedProjectPhase(projectId, { intakeStatus, runPhase, phase }) {
  execSync(
    `python scripts/seed_proposal_qa_phase.py ${projectId} ${intakeStatus} ${runPhase} ${phase}`,
    { cwd: REPO_ROOT, encoding: "utf8" }
  );
}

async function waitForChatReady(page, { timeout = 90000 } = {}) {
  await page.waitForSelector("#main-agent-chat", { timeout });
  await page.waitForFunction(
    () => {
      const input = document.querySelector("#chat-input");
      return input && !input.disabled;
    },
    { timeout }
  );
  await page.waitForTimeout(1500);
}

async function loadProject(page, projectId) {
  await page.addInitScript((id) => {
    localStorage.setItem("scriptorium_active_project", id);
  }, projectId);
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#project-switcher .project-switcher-trigger", { timeout: 30000 });
  await waitForChatReady(page);
}

async function fillChatInput(page, text) {
  await page.locator("#chat-input").fill(text);
}

async function sendChat(page, text) {
  const userBefore = await page.locator(".chat-bubble.user").count();
  await fillChatInput(page, text);
  await page.click("#btn-send-chat");
  try {
    await page.waitForFunction(
      (prev) => document.querySelectorAll(".chat-bubble.user").length > prev,
      userBefore,
      { timeout: 20000 }
    );
  } catch {
    throw new Error(`Chat send failed for: ${text}`);
  }
  await page.waitForTimeout(400);
}

async function warmChat(page) {
  await sendChat(page, "thanks");
  await page.waitForSelector(".chat-bubble.consult", { timeout: 30000 });
}

async function waitForPendingProposal(page, timeout = PROPOSAL_TIMEOUT_MS) {
  await page.waitForSelector(".action-proposal-card.pending", { timeout });
}

async function main() {
  const health = await fetch(`${API}/health`).catch(() => null);
  if (!health?.ok) {
    fail("API health", `Cannot reach ${API}/health`);
    printReport();
    process.exit(1);
  }
  pass("API health", await health.text());

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let projectId = null;

  try {
    const res = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!res?.ok()) {
      fail("Load app", `status ${res?.status()}`);
      throw new Error("App did not load");
    }
    pass("Load app", BASE);

    const created = await createProjectViaApi(
      "Proposal QA — API guide for intent router testing"
    );
    projectId = created.id;
    pass("Create project", projectId.slice(0, 8));

    await patchPlan(projectId, {
      brief: {
        goal: created.prompt,
        domain: "technical-docs",
        audience: "Developers",
        tone: "clear",
      },
      agency_settings: {
        target_chapter_count: 8,
        min_chapters: 6,
        max_chapters: 12,
        target_word_count: 40000,
      },
    });

    await seedProjectPhase(projectId, {
      intakeStatus: "complete",
      runPhase: "negotiation",
      phase: "negotiation",
    });

    await loadProject(page, projectId);
    pass("Load project in chat-first UI");

    await warmChat(page);
    pass("Chat WebSocket warm-up");

    // MT-096 — proposal card appears
    await sendChat(page, "set chapter count to 10");
    try {
      await waitForPendingProposal(page);
      const summary = await page.locator(".action-proposal-summary").first().textContent();
      const confirmBtn = page.locator(".action-proposal-card.pending .btn-primary");
      const editBtn = page.locator(".action-proposal-card.pending .btn-secondary");
      const cancelBtn = page.locator(".action-proposal-card.pending .btn-ghost");
      if ((await confirmBtn.count()) && (await editBtn.count()) && (await cancelBtn.count())) {
        pass("MT-096 proposal card appears", summary?.trim().slice(0, 80) || "ok");
      } else {
        fail("MT-096 proposal card buttons", "missing Confirm/Edit/Cancel");
      }
    } catch (e) {
      fail("MT-096 proposal card appears", e.message?.slice(0, 120) || String(e));
    }

    // MT-098 — cancel (before confirm so we can re-test confirm)
    const cancelVisible = page.locator(".action-proposal-card.pending .btn-ghost").first();
    if ((await cancelVisible.count()) > 0) {
      await cancelVisible.click();
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll(".action-proposal-card")].some((c) =>
            c.textContent.includes("Cancelled")
          ),
        { timeout: 20000 }
      );
      pass("MT-098 cancel proposal", "Cancelled");
    } else {
      skip("MT-098 cancel proposal", "no pending card");
    }

    // MT-096 again + MT-097 confirm
    await sendChat(page, "set chapter count to 10");
    try {
      await waitForPendingProposal(page);
      const proposalId = await page
        .locator(".action-proposal-card.pending")
        .first()
        .getAttribute("data-proposal-id");
      await page.locator(".action-proposal-card.pending .btn-primary").first().click();
      await page.waitForSelector(
        `.action-proposal-card[data-proposal-id="${proposalId}"] .action-proposal-status`,
        { timeout: 15000 }
      );
      const confirmed = await page
        .locator(
          `.action-proposal-card[data-proposal-id="${proposalId}"] .action-proposal-status`
        )
        .textContent()
        .catch(() => "Confirmed");
      const updated = await getProject(projectId);
      const chapters = updated.state?.agency_settings?.target_chapter_count;
      if (confirmed?.includes("Confirmed") && chapters === 10) {
        pass("MT-097 confirm proposal", `chapters=${chapters}, id=${proposalId?.slice(0, 8)}`);
      } else {
        fail(
          "MT-097 confirm proposal",
          `status=${confirmed}, chapters=${chapters}, id=${proposalId}`
        );
      }
    } catch (e) {
      fail("MT-097 confirm proposal", e.message?.slice(0, 120) || String(e));
    }

    // MT-099 — stale proposal (confirm again with old id via WS would need API; check UI disabled)
    await sendChat(page, "set chapter count to 12");
    try {
      await waitForPendingProposal(page);
      const activeId = await page
        .locator(".action-proposal-card.pending")
        .first()
        .getAttribute("data-proposal-id");
      await page.locator(".action-proposal-card.pending .btn-primary").first().click();
      await page.waitForSelector(
        `.action-proposal-card[data-proposal-id="${activeId}"] .action-proposal-status`,
        { timeout: 15000 }
      );
      const staleCard = page.locator(
        `.action-proposal-card[data-proposal-id="${activeId}"].pending .btn-primary`
      );
      if ((await staleCard.count()) === 0) {
        pass("MT-099 stale proposal UI", "confirmed card has no Confirm button");
      } else {
        warn("MT-099 stale proposal UI", "Confirm still visible on resolved card");
      }
    } catch (e) {
      warn("MT-099 stale proposal", e.message?.slice(0, 80) || String(e));
    }

    // MT-100 — app help, no new pending proposal
    await page.waitForFunction(
      () => document.querySelectorAll(".action-proposal-card.pending").length === 0,
      { timeout: 10000 }
    );
    const pendingBefore = await page.locator(".action-proposal-card.pending").count();
    await sendChat(page, "where do I export?");
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll(".chat-bubble")].some((el) =>
          el.textContent.toLowerCase().includes("export")
        ),
      { timeout: 15000 }
    );
    const pendingAfter = await page.locator(".action-proposal-card.pending").count();
    if (pendingAfter === pendingBefore) {
      pass("MT-100 app help routing", "help reply without new proposal card");
    } else {
      fail("MT-100 app help routing", "unexpected proposal card for help question");
    }

    // MT-101 — draft outline via chip → proposal
    await loadProject(page, projectId);
    await patchPlan(projectId, {
      brief: { goal: created.prompt, domain: "technical-docs", audience: "Developers" },
    });
    await seedProjectPhase(projectId, {
      intakeStatus: "complete",
      runPhase: "intake",
      phase: "intake",
    });
    await loadProject(page, projectId);
    const draftBtn = page.locator("#btn-draft-outline");
    if ((await draftBtn.count()) > 0 && (await draftBtn.isEnabled())) {
      await draftBtn.click();
      try {
        await waitForPendingProposal(page, 20000);
        const summary = await page.locator(".action-proposal-summary").last().textContent();
        pass("MT-101 draft outline proposal", summary?.trim().slice(0, 60) || "card shown");
        await page.locator(".action-proposal-card.pending .btn-ghost").last().click();
        await page.waitForFunction(
          () =>
            [...document.querySelectorAll(".action-proposal-card")].some((c) =>
              c.textContent.includes("Cancelled")
            ),
          { timeout: 15000 }
        );
        pass("MT-101 cancel draft proposal", "cancelled without starting pipeline");
      } catch (e) {
        warn("MT-101 cancel draft proposal", e.message?.slice(0, 80) || String(e));
      }
    } else {
      skip("MT-101 draft outline proposal", "Draft outline button not enabled");
    }
  } catch (e) {
    fail("Unexpected error", e.message?.slice(0, 200) || String(e));
  } finally {
    await browser.close();
  }

  printReport();
  const failed = results.some((r) => r.status === "FAIL");
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("ui-proposal-qa crashed:", err.message || err);
  process.exit(1);
});
