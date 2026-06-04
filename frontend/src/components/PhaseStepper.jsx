import { STEPPER_STEPS, STEPPER_HINTS, getPhaseMeta, isPipelineBusy } from "../lib/phases.js";

export default function PhaseStepper({ phase }) {
  const meta = getPhaseMeta(phase);
  const activeStep = meta.step;
  const busy = isPipelineBusy(phase);
  const activeLabel = STEPPER_STEPS[activeStep - 1];
  const activeHint = activeLabel ? STEPPER_HINTS[activeLabel] : "";

  return (
    <div className="phase-stepper-wrap">
      <nav className="phase-stepper" aria-label="Production phase">
        {STEPPER_STEPS.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === activeStep;
          const isDone = stepNum < activeStep;
          const hint = STEPPER_HINTS[label];
          return (
            <span
              key={label}
              className={`phase-step${isActive ? " active" : ""}${isDone ? " done" : ""}${isActive && busy ? " is-busy" : ""}`}
              title={hint || label}
            >
              {label}
            </span>
          );
        })}
      </nav>
      {activeHint && (
        <p className="phase-stepper-hint" aria-live="polite">
          {activeHint}
        </p>
      )}
      {busy && activeStep > 0 && activeStep < STEPPER_STEPS.length && (
        <div className="phase-stepper-progress" aria-hidden>
          <div className="phase-stepper-progress-bar" />
        </div>
      )}
    </div>
  );
}
