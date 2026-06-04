export const PHASES = {
  idle: { label: "Idle", step: 0, tone: "idle" },
  intake: { label: "Consult", step: 1, tone: "active" },
  planning: { label: "Building plan", step: 1, tone: "active" },
  negotiation: { label: "Plan", step: 2, tone: "warning" },
  drafting: { label: "Draft", step: 3, tone: "active" },
  scrubbing: { label: "Draft", step: 3, tone: "active" },
  copyediting: { label: "Draft", step: 3, tone: "active" },
  reviewing: { label: "Review", step: 4, tone: "active" },
  review_halt: { label: "Halted", step: 4, tone: "danger" },
  publishing: { label: "Done", step: 5, tone: "success" },
  finished: { label: "Done", step: 5, tone: "success" },
};

export const STEPPER_STEPS = ["Consult", "Plan", "Draft", "Review", "Done"];

/** Plain-language hints for the active step (novice UX). */
export const STEPPER_HINTS = {
  Consult: "Tell us about your project",
  Plan: "Review and edit the outline",
  Draft: "Chapters are being written",
  Review: "Resolve editorial tickets",
  Done: "Export when you are ready",
};

export function isIntakeConsultPhase(phase, intakeStatus) {
  return phase === "intake" && intakeStatus !== "complete";
}

/** Show Draft outline CTA while still in consult phase (including intake complete). */
export function canGeneratePlan(phase, intakeStatus) {
  return phase === "intake" && intakeStatus !== "not_started";
}

export function getPhaseMeta(phase) {
  return PHASES[phase] || PHASES.idle;
}

export function isEditablePlanPhase(phase) {
  return ["negotiation", "planning", "idle", "intake"].includes(phase);
}

export function isFinishedPhase(phase) {
  return ["finished", "publishing"].includes(phase);
}

export function isPipelineBusy(phase) {
  return [
    "intake",
    "planning",
    "drafting",
    "scrubbing",
    "copyediting",
    "reviewing",
  ].includes(phase);
}

/** Export when signed off and at least one chapter exists in memory. */
export function canShowExport(phase, manuscript) {
  if (!isFinishedPhase(phase)) return false;
  const ms = manuscript || {};
  if (ms.final_manuscript) return true;
  return Object.keys(ms).some((k) => k !== "final_manuscript");
}

export function isWaitingForOutline(phase, sectionCount, intakeStatus = "complete") {
  if (phase === "intake" && intakeStatus !== "complete") {
    return false;
  }
  return isPipelineBusy(phase) && sectionCount === 0;
}

export function parseSaveStatus(text) {
  if (!text) return "";
  if (/saving/i.test(text)) return "saving";
  if (/saved/i.test(text)) return "saved";
  if (/fail/i.test(text)) return "error";
  return "";
}

export function isExportingStatus(text) {
  return typeof text === "string" && /^Exporting/i.test(text);
}
