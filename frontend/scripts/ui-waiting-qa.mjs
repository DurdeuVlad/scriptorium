/**
 * QA pass for UI waiting animations (plan verification).
 * Run: cd frontend && npm run ui-waiting-qa
 * Requires dev server at SCRIPTORIUM_BASE_URL (default http://localhost:5173) and API on :8001.
 */
import { chromium } from "playwright";

const BASE = process.env.SCRIPTORIUM_BASE_URL || "http://localhost:5173";
const API = process.env.SCRIPTORIUM_API_URL || "http://127.0.0.1:8001";

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

async function main() {
  const health = await fetch(`${API}/health`).catch(() => null);
  if (!health?.ok) {
    fail("API health", `Cannot reach ${API}/health`);
  } else {
    pass("API health", `${API} OK`);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    const res = await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!res?.ok()) {
      fail("Load app", `${BASE} status ${res?.status()}`);
      throw new Error("App did not load");
    }
    pass("Load app", BASE);

    const welcomeClass = await page.getAttribute("#welcome-empty", "class");
    if (welcomeClass?.includes("animate-enter")) pass("Welcome entrance", "animate-enter on #welcome-empty");
    else fail("Welcome entrance", `class="${welcomeClass}"`);

    await page.click("#project-switcher .project-switcher-trigger");
    await page.click("#btn-new-project");
    await page.waitForSelector("#new-project-modal");

    const backdropClass = await page.locator(".modal-backdrop").first().getAttribute("class");
    const cardClass = await page.locator(".modal-card").first().getAttribute("class");
    if (backdropClass?.includes("animate-fade-in")) pass("Modal backdrop", "animate-fade-in");
    else fail("Modal backdrop", backdropClass || "missing");
    if (cardClass?.includes("animate-enter")) pass("Modal card", "animate-enter");
    else fail("Modal card", cardClass || "missing");

    await page.fill("#new-project-prompt", "Waiting animations QA brief");
    await page.fill("#new-project-audience", "QA testers");
    await page.click('button:has-text("Next")');
    await page.waitForSelector("#btn-commission-project", { timeout: 5000 });

    await page.route(`${API}/projects`, async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((r) => setTimeout(r, 800));
      }
      await route.continue();
    });

    const commissionPromise = page.click("#btn-commission-project");
    await page.waitForFunction(
      () => {
        const btn = document.querySelector("#btn-commission-project");
        return btn?.disabled || btn?.textContent?.includes("Commissioning");
      },
      { timeout: 5000 }
    ).catch(() => null);

    const btnText = await page.locator("#btn-commission-project").innerText().catch(() => "");
    const hasSpinner = (await page.locator("#btn-commission-project .animate-activity-ring").count()) > 0;
    const btnDisabled = await page.locator("#btn-commission-project").isDisabled().catch(() => false);
    if (hasSpinner || /Commissioning/i.test(btnText)) pass("Commission spinner", btnText.trim() || "spinner visible");
    else warn("Commission spinner", "POST may be too fast; spinner not captured");
    if (btnDisabled) pass("Commission disabled while submitting");
    else warn("Commission disabled while submitting", "button not disabled during delay");

    await commissionPromise;
    await page.waitForSelector("#plan-editor", { timeout: 20000 });
    pass("Plan editor after commission");

    const phaseBadge = await page.locator(".assistant-strip .phase-badge, .assistant-drawer .phase-badge").first().innerText();
    const ringCount = await page.locator(".assistant-strip .animate-activity-ring, .pipeline-busy-indicator .animate-activity-ring").count();
    if (ringCount > 0) pass("Assistant busy ring", `phase=${phaseBadge}, rings=${ringCount}`);
    else warn("Assistant busy ring", `No ring visible (phase=${phaseBadge})`);

    const waitingPanel = page.locator(".waiting-panel");
    if ((await waitingPanel.count()) > 0) {
      pass("Plan waiting panel", "visible while outline pending");
      const skeletons = await page.locator(".waiting-panel-skeleton-row").count();
      if (skeletons >= 3) pass("Shimmer skeleton rows", `${skeletons} rows`);
      else warn("Shimmer skeleton rows", `expected 3+, got ${skeletons}`);
    } else {
      warn("Plan waiting panel", "Outline may have arrived before check");
    }

    await page.fill("#plan-title", " QA animation title");
    await page.waitForSelector(".save-status-badge.saving", { timeout: 3000 }).catch(() => null);
    const savingVisible = (await page.locator(".save-status-badge.saving").count()) > 0;
    if (savingVisible) pass("Plan save badge saving");
    else fail("Plan save badge saving", "no .save-status-badge.saving after edit");

    await page.waitForSelector(".save-status-badge.saved", { timeout: 5000 }).catch(() => null);
    const savedVisible = (await page.locator(".save-status-badge.saved").count()) > 0;
    if (savedVisible) pass("Plan save badge saved");
    else fail("Plan save badge saved", "no .save-status-badge.saved within 5s");

    await page.click("#assistant-toggle");
    await page.waitForSelector(".assistant-drawer.open");
    const dots = await page.locator(".pipeline-busy-indicator .animate-waiting-dots").count();
    if (dots > 0) pass("Expanded assistant WaitingDots");
    else warn("Expanded assistant WaitingDots", "pipeline may have finished");

    const stepperBusy = await page.locator(".phase-step.active.is-busy").count();
    const progressBar = await page.locator(".phase-stepper-progress-bar").count();
    if (stepperBusy > 0 && progressBar > 0) pass("Phase stepper busy state");
    else warn("Phase stepper busy state", `active.is-busy=${stepperBusy}, progress=${progressBar}`);

    await page.emulateMedia({ reducedMotion: "reduce" });
    const reducedCss = await page.evaluate(() => {
      const el = document.createElement("div");
      el.className = "animate-activity-ring size-sm";
      document.body.appendChild(el);
      const anim = getComputedStyle(el).animationName;
      document.body.removeChild(el);
      return anim;
    });
    if (reducedCss === "none") pass("Reduced motion", "activity ring animation disabled");
    else fail("Reduced motion", `animationName=${reducedCss}`);

    const controlledWarnings = consoleErrors.filter((t) =>
      /controlled|uncontrolled/i.test(t)
    );
    if (controlledWarnings.length === 0) pass("No controlled/uncontrolled console errors");
    else fail("No controlled/uncontrolled console errors", controlledWarnings.join("; "));

    const otherErrors = consoleErrors.filter((t) => !/controlled|uncontrolled/i.test(t));
    if (otherErrors.length === 0) pass("No other console errors");
    else warn("Console errors", otherErrors.slice(0, 3).join("; "));
  } finally {
    await browser.close();
  }

  const fails = results.filter((r) => r.status === "FAIL");
  const warns = results.filter((r) => r.status === "WARN");
  console.log("\n=== UI Waiting Animations QA ===\n");
  for (const r of results) {
    const tag = r.status.padEnd(4);
    console.log(`${tag} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  console.log(`\nSummary: ${results.filter((r) => r.status === "PASS").length} pass, ${warns.length} warn, ${fails.length} fail`);
  if (fails.length) process.exit(1);
}

main().catch((err) => {
  console.error("QA runner crashed:", err);
  process.exit(1);
});
