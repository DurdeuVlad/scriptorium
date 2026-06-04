/**
 * Minimal UI smoke test for Scriptorium (consult-first flow).
 * Manual procedures: tests/manual/README.md (MT-001, MT-020, MT-037, MT-041, MT-060, MT-063).
 * Run: cd frontend && npm install && npx playwright install chromium && npm run ui-smoke
 */
import { chromium } from "playwright";

const BASE = process.env.SCRIPTORIUM_BASE_URL || "http://localhost:5173";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const res = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!res || !res.ok()) {
      throw new Error(`Failed to load ${BASE}: ${res?.status()}`);
    }

    // MT-001 welcome empty
    await page.waitForSelector("#project-switcher", { timeout: 5000 });
    // MT-001 welcome — document panel may be hidden until project loads
    await page.waitForSelector("#welcome-empty, #main-agent-chat", { timeout: 10000 });

    await page.click("#project-switcher .project-switcher-trigger");
    await page.waitForSelector("#btn-new-project", { timeout: 5000 });
    // MT-020 new project modal
    await page.click("#btn-new-project");

    await page.waitForSelector("#new-project-modal", { timeout: 5000 });
    await page.fill("#new-project-prompt", "Smoke test API guide for developers");
    // MT-037 commission project
    await page.click("#btn-commission-project");

    await page.waitForSelector("#plan-editor", { timeout: 15000 });
    // MT-011 / MT-060 chat-first main agent
    await page.waitForSelector("#main-agent-chat", { timeout: 10000 });
    await page.waitForSelector(".chat-bubble", { timeout: 45000 });
    // MT-063 draft outline CTA
    await page.waitForSelector("#btn-draft-outline", { timeout: 45000 });

    const consultantBubble = page.locator(
      ".chat-bubble.consultant, .chat-bubble.consult, .chat-bubble.assistant, .chat-bubble.system"
    );
    if ((await consultantBubble.count()) === 0) {
      throw new Error("Expected consult conversation messages in assistant");
    }

    await page.waitForSelector("#artifact-nav", { timeout: 5000 });
    const planNav = page.locator('[data-artifact="plan"]');
    if ((await planNav.count()) === 0) {
      throw new Error("Missing Plan artifact nav item");
    }

    console.log(`UI smoke passed: ${BASE}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("UI smoke failed:", err.message || err);
  process.exit(1);
});
