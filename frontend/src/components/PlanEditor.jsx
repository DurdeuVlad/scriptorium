import { useCallback, useEffect, useRef, useState } from "react";

import { isEditablePlanPhase, isWaitingForOutline, parseSaveStatus } from "../lib/phases.js";
import { emptySection, flattenSections } from "../lib/outlineTree.js";

import AgencySettingsCard from "./AgencySettingsCard.jsx";
import VoicePicker from "./VoicePicker.jsx";
import SaveStatusBadge from "./ui/SaveStatusBadge.jsx";
import WaitingPanel from "./ui/WaitingPanel.jsx";

function asBriefText(value, fallback = "") {
  if (value == null || value === "") return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((v) => asBriefText(v)).filter(Boolean).join("; ");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${asBriefText(v)}`)
      .join("; ");
  }
  return String(value);
}

function SectionRow({
  sec,
  path,
  editable,
  onUpdate,
  onRemove,
  onMove,
  onAddSub,
  canMoveUp,
  canMoveDown,
  depth,
}) {
  const indent = { paddingLeft: `${(depth - 1) * 16}px` };

  return (
    <li className="outline-item" style={indent}>
      <div className="outline-item-head">
        <span className="outline-id">{sec.id}</span>
        {editable && (
          <div className="outline-item-actions">
            <button type="button" className="btn-ghost btn-sm" onClick={() => onMove(path, -1)} disabled={!canMoveUp}>
              ↑
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => onMove(path, 1)} disabled={!canMoveDown}>
              ↓
            </button>
            {depth < 3 && (
              <button type="button" className="btn-ghost btn-sm" onClick={() => onAddSub(path)}>
                + Sub
              </button>
            )}
            <button type="button" className="btn-ghost btn-sm danger" onClick={() => onRemove(path)}>
              Remove
            </button>
          </div>
        )}
      </div>
      {editable ? (
        <>
          <input
            className="outline-title-input"
            value={sec.title || ""}
            onChange={(e) => onUpdate(path, "title", e.target.value)}
            placeholder={depth > 1 ? "Subsection title" : "Section title"}
          />
          <textarea
            className="outline-goal-input"
            rows={2}
            value={sec.goal || ""}
            onChange={(e) => onUpdate(path, "goal", e.target.value)}
            placeholder="Section goal"
          />
        </>
      ) : (
        <>
          <div className="outline-item-title">{sec.title}</div>
          {sec.goal && <p className="outline-goal">{sec.goal}</p>}
        </>
      )}
    </li>
  );
}

export default function PlanEditor({
  brief,
  outline,
  prompt,
  audience,
  domain,
  phase,
  projectId,
  onPlanChange,
  onSavePlan,
  intakeStatus = "complete",
  agencySettings,
  activeStylePack,
  onAgencySettingsChange,
  onStylePackChange,
}) {
  const editable = isEditablePlanPhase(phase);
  const [localBrief, setLocalBrief] = useState({
    title: "",
    goal: "",
    audience: "",
    tone: "",
    domain: "",
    constraints: [],
  });
  const [sections, setSections] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");
  const saveTimerRef = useRef(null);

  useEffect(() => {
    setLocalBrief({
      title: asBriefText(brief?.title, ""),
      goal: asBriefText(brief?.goal, prompt || ""),
      audience: asBriefText(brief?.audience, audience || ""),
      tone: asBriefText(brief?.tone, ""),
      domain: asBriefText(brief?.domain, domain || ""),
      constraints: Array.isArray(brief?.constraints)
        ? brief.constraints.map((c) => (typeof c === "string" ? c : JSON.stringify(c)))
        : [],
    });
    setSections(outline?.sections?.length ? outline.sections.map((s) => ({ ...s, subsections: s.subsections || [] })) : []);
  }, [brief, outline, prompt, audience, domain]);

  const scheduleSave = useCallback(
    (nextBrief, nextSections, nextAgency, nextVoice) => {
      if (!projectId || !editable) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("Saving…");
      saveTimerRef.current = setTimeout(async () => {
        const payload = {
          brief: nextBrief,
          outline: { sections: nextSections },
          agency_settings: nextAgency,
          active_style_pack: nextVoice,
        };
        onPlanChange(payload);
        const ok = await onSavePlan(payload);
        setSaveStatus(ok ? "Saved" : "Save failed");
      }, 600);
    },
    [projectId, editable, onPlanChange, onSavePlan]
  );

  const updateBriefField = (field, value) => {
    const next = { ...localBrief, [field]: value };
    setLocalBrief(next);
    scheduleSave(next, sections, agencySettings, activeStylePack);
  };

  const getAtPath = (list, path) => {
    let cur = list;
    for (let i = 0; i < path.length - 1; i++) {
      cur = cur[path[i]].subsections;
    }
    return { list: cur, index: path[path.length - 1] };
  };

  const updateAtPath = (path, field, value) => {
    const next = JSON.parse(JSON.stringify(sections));
    const { list, index } = getAtPath(next, path);
    list[index] = { ...list[index], [field]: value };
    setSections(next);
    scheduleSave(localBrief, next, agencySettings, activeStylePack);
  };

  const removeAtPath = (path) => {
    const next = JSON.parse(JSON.stringify(sections));
    const { list, index } = getAtPath(next, path);
    list.splice(index, 1);
    setSections(next);
    scheduleSave(localBrief, next, agencySettings, activeStylePack);
  };

  const moveAtPath = (path, direction) => {
    const next = JSON.parse(JSON.stringify(sections));
    const { list, index } = getAtPath(next, path);
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    setSections(next);
    scheduleSave(localBrief, next, agencySettings, activeStylePack);
  };

  const addSubAtPath = (path) => {
    const next = JSON.parse(JSON.stringify(sections));
    const { list, index } = getAtPath(next, path);
    const parent = list[index];
    parent.subsections = parent.subsections || [];
    parent.subsections.push(emptySection(parent.subsections.length, path.length + 1));
    setSections(next);
    scheduleSave(localBrief, next, agencySettings, activeStylePack);
  };

  const addSection = () => {
    const next = [...sections, emptySection(sections.length)];
    setSections(next);
    scheduleSave(localBrief, next, agencySettings, activeStylePack);
  };

  const handleAgencyChange = (nextAgency) => {
    onAgencySettingsChange?.(nextAgency);
    scheduleSave(localBrief, sections, nextAgency, activeStylePack);
  };

  const handleVoiceChange = (voiceId) => {
    onStylePackChange?.(voiceId);
    scheduleSave(localBrief, sections, agencySettings, voiceId);
  };

  const waitingForOutline = isWaitingForOutline(phase, sections.length, intakeStatus);
  const flat = flattenSections(sections);
  const saveBadgeStatus = parseSaveStatus(saveStatus);

  const renderSection = (sec, path, depth, siblings) => {
    const idx = path[path.length - 1];
    return (
      <SectionRow
        key={sec.id || path.join("-")}
        sec={sec}
        path={path}
        depth={depth}
        editable={editable}
        onUpdate={updateAtPath}
        onRemove={removeAtPath}
        onMove={moveAtPath}
        onAddSub={addSubAtPath}
        canMoveUp={idx > 0}
        canMoveDown={idx < siblings.length - 1}
      />
    );
  };

  const renderTree = (list, basePath, depth) =>
    list.map((sec, index) => {
      const path = [...basePath, index];
      const subs = sec.subsections || [];
      return (
        <div key={sec.id || path.join("-")}>
          {renderSection(sec, path, depth, list)}
          {subs.length > 0 && (
            <ol className="outline-list outline-sublist">
              {subs.map((sub, si) => renderSection(sub, [...path, si], depth + 1, subs))}
            </ol>
          )}
        </div>
      );
    });

  return (
    <div className="plan-editor" id="plan-editor">
      <div className="plan-editor-header">
        <h2>Plan</h2>
        <SaveStatusBadge status={saveBadgeStatus} />
        {!editable && <span className="plan-readonly-badge">Read-only after approval</span>}
      </div>

      <section className="plan-section">
        <AgencySettingsCard
          agencySettings={agencySettings}
          editable={editable}
          onChange={handleAgencyChange}
        />
        <VoicePicker
          projectId={projectId}
          activeVoice={activeStylePack}
          editable={editable}
          onSelect={handleVoiceChange}
        />
      </section>

      <section className="plan-section">
        <h3>Brief</h3>
        <div className="plan-field">
          <label htmlFor="plan-title">Title</label>
          {editable ? (
            <input id="plan-title" value={localBrief.title} onChange={(e) => updateBriefField("title", e.target.value)} />
          ) : (
            <p>{localBrief.title || "—"}</p>
          )}
        </div>
        <div className="plan-field">
          <label htmlFor="plan-goal">Goal</label>
          {editable ? (
            <textarea id="plan-goal" rows={2} value={localBrief.goal} onChange={(e) => updateBriefField("goal", e.target.value)} />
          ) : (
            <p>{localBrief.goal || "—"}</p>
          )}
        </div>
        <div className="plan-field">
          <label htmlFor="plan-audience">Audience</label>
          {editable ? (
            <input id="plan-audience" value={localBrief.audience} onChange={(e) => updateBriefField("audience", e.target.value)} />
          ) : (
            <p>{localBrief.audience || "—"}</p>
          )}
        </div>
        <div className="plan-field">
          <label htmlFor="plan-tone">Tone</label>
          {editable ? (
            <input id="plan-tone" value={localBrief.tone} onChange={(e) => updateBriefField("tone", e.target.value)} />
          ) : (
            <p>{localBrief.tone || "—"}</p>
          )}
        </div>
      </section>

      <section className="plan-section">
        <div className="plan-section-head">
          <h3>Outline ({sections.length} chapters, {flat.length} units)</h3>
          {editable && !waitingForOutline && (
            <button type="button" className="btn-secondary btn-sm" onClick={addSection}>
              Add chapter
            </button>
          )}
        </div>

        {waitingForOutline ? (
          <WaitingPanel
            title="Building your outline"
            hint="Scriptorium is drafting sections from your brief."
          />
        ) : sections.length === 0 ? (
          <p className="plan-muted">No outline sections yet.</p>
        ) : (
          <ol className="outline-list">{renderTree(sections, [], 1)}</ol>
        )}
      </section>
    </div>
  );
}
